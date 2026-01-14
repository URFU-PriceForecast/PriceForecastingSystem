"""
Система сравнения ML моделей
Оценивает производительность разных моделей и выбирает лучшую
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from models.forecast_models import get_model, BaseModel
from evaluation.metrics import MetricsEvaluator


class ModelComparison:
    """
    Класс для сравнения производительности ML моделей
    """

    def __init__(self):
        self.models = ["naive", "ma", "linear", "arima", "exponential"]
        self.metrics_evaluator = MetricsEvaluator()

    def compare_models(
        self,
        historical_prices: List[float],
        historical_dates: List[datetime],
        test_days: int = 30
    ) -> Dict:
        """
        Сравнивает все модели на исторических данных

        Args:
            historical_prices: Исторические цены
            historical_dates: Даты исторических данных
            test_days: Количество дней для тестирования

        Returns:
            {
                "best_model": "linear",
                "model_results": {
                    "model_name": {
                        "metrics": {...},
                        "predictions": [...],
                        "inference_time": 0.05
                    }
                },
                "comparison_summary": {...}
            }
        """

        if len(historical_prices) < test_days + 10:
            raise ValueError(f"Недостаточно данных. Нужно минимум {test_days + 10} точек")

        # Разделяем данные на train/test
        train_prices = historical_prices[:-test_days]
        train_dates = historical_dates[:-test_days]
        test_prices = historical_prices[-test_days:]
        test_dates = historical_dates[-test_days:]

        results = {}

        for model_type in self.models:
            try:
                model = get_model(model_type)

                # Прогноз на test период
                forecast_result = model.predict(train_prices, train_dates, days_ahead=test_days)

                # Вычисляем метрики
                metrics = self.metrics_evaluator.calculate_metrics(
                    actual=test_prices,
                    predicted=forecast_result.predictions,
                    inference_time=forecast_result.inference_time
                )

                results[model_type] = {
                    "model_name": model.name,
                    "metrics": metrics.to_dict(),
                    "predictions": forecast_result.predictions,
                    "inference_time": forecast_result.inference_time,
                    "trend": forecast_result.trend,
                    "success": True
                }

            except Exception as e:
                results[model_type] = {
                    "model_name": f"{model_type} (failed)",
                    "error": str(e),
                    "success": False
                }

        # Определяем лучшую модель
        best_model = self._select_best_model(results)

        return {
            "best_model": best_model,
            "model_results": results,
            "comparison_summary": self._create_comparison_summary(results),
            "test_period_days": test_days,
            "data_points": len(historical_prices)
        }

    def _select_best_model(self, results: Dict) -> str:
        """Выбирает лучшую модель по комплексной оценке"""

        scores = {}

        for model_type, result in results.items():
            if not result.get("success", False):
                scores[model_type] = 0
                continue

            metrics = result["metrics"]

            # Комплексная оценка:
            # 40% - точность (1 - MAPE/100, нормированная)
            # 30% - direction accuracy
            # 20% - inference time (быстрее = лучше)
            # 10% - качество прогноза

            accuracy_score = max(0, 1 - metrics["mape"] / 100) * 40
            direction_score = metrics["direction_accuracy"] * 30

            # Нормируем время (меньше = лучше, макс 2 сек = 100%)
            time_score = max(0, (2 - result["inference_time"]) / 2) * 20

            forecast_quality_score = metrics.get("forecast_7d_quality", False) * 10

            total_score = accuracy_score + direction_score + time_score + forecast_quality_score
            scores[model_type] = total_score

        # Возвращаем модель с максимальным score
        best_model = max(scores, key=scores.get)

        # Если лучшая модель имеет score < 30, возвращаем linear (надежная)
        if scores[best_model] < 30:
            return "linear"

        return best_model

    def _create_comparison_summary(self, results: Dict) -> Dict:
        """Создает сводку сравнения моделей"""

        successful_models = [m for m, r in results.items() if r.get("success", False)]

        if not successful_models:
            return {"error": "Нет успешных моделей"}

        summary = {
            "total_models_tested": len(self.models),
            "successful_models": len(successful_models),
            "best_accuracy": {
                "model": None,
                "mape": float('inf'),
                "direction_accuracy": 0
            },
            "fastest_model": {
                "model": None,
                "time": float('inf')
            },
            "model_performance": {}
        }

        for model_type, result in results.items():
            if not result.get("success", False):
                continue

            metrics = result["metrics"]

            # Лучшая точность
            if metrics["mape"] < summary["best_accuracy"]["mape"]:
                summary["best_accuracy"].update({
                    "model": model_type,
                    "mape": metrics["mape"],
                    "direction_accuracy": metrics["direction_accuracy"]
                })

            # Самая быстрая
            if result["inference_time"] < summary["fastest_model"]["time"]:
                summary["fastest_model"].update({
                    "model": model_type,
                    "time": result["inference_time"]
                })

            # Рейтинг всех моделей
            summary["model_performance"][model_type] = {
                "mape": metrics["mape"],
                "direction_accuracy": metrics["direction_accuracy"],
                "inference_time": result["inference_time"],
                "overall_quality": metrics.get("overall_quality", False)
            }

        return summary

    def get_model_recommendation(
        self,
        comparison_results: Dict,
        data_characteristics: Dict = None
    ) -> Dict:
        """
        Дает рекомендацию по выбору модели с учетом характеристик данных

        Args:
            comparison_results: Результаты сравнения моделей
            data_characteristics: Характеристики данных (опционально)
                - volatility: волатильность
                - trend_strength: сила тренда
                - seasonality: наличие сезонности
                - data_points: количество точек
        """

        if data_characteristics is None:
            data_characteristics = {}

        best_model = comparison_results["best_model"]
        model_results = comparison_results["model_results"]

        # Анализируем характеристики данных для рекомендаций
        recommendations = {
            "recommended_model": best_model,
            "reasoning": [],
            "alternative_models": [],
            "confidence": "medium"
        }

        # Логика рекомендаций на основе данных
        if data_characteristics.get("data_points", 100) < 30:
            recommendations["reasoning"].append("Мало данных - рекомендуется простая модель")
            if best_model in ["arima", "exponential"]:
                recommendations["alternative_models"].append("linear")

        if data_characteristics.get("volatility", 0.1) > 0.3:
            recommendations["reasoning"].append("Высокая волатильность - нужна адаптивная модель")

        if data_characteristics.get("trend_strength", 0.5) > 0.7:
            recommendations["reasoning"].append("Сильный тренд - линейная модель оптимальна")
            recommendations["recommended_model"] = "linear"

        # Устанавливаем уверенность
        best_metrics = model_results[best_model]["metrics"]
        if best_metrics["mape"] < 10 and best_metrics["direction_accuracy"] > 70:
            recommendations["confidence"] = "high"
        elif best_metrics["mape"] < 20 and best_metrics["direction_accuracy"] > 60:
            recommendations["confidence"] = "medium"
        else:
            recommendations["confidence"] = "low"

        return recommendations


def compare_models_demo():
    """Демонстрация сравнения моделей"""

    print("="*80)
    print("🧪 ДЕМОНСТРАЦИЯ СРАВНЕНИЯ ML МОДЕЛЕЙ")
    print("="*80)

    # Генерируем тестовые данные
    dates = pd.date_range(start='2024-10-01', end='2024-12-30', freq='D').tolist()

    # Создаем тренд с шумом
    base_prices = [50000 + i * 50 for i in range(len(dates))]
    noise = np.random.normal(0, 1000, len(dates))
    seasonal = [2000 * np.sin(2 * np.pi * i / 30) for i in range(len(dates))]

    prices = [base + noise + season for base, noise, season in zip(base_prices, noise, seasonal)]

    # Создаем компаратор
    comparator = ModelComparison()

    # Сравниваем модели
    results = comparator.compare_models(prices, dates, test_days=30)

    print(f"\n📊 РЕЗУЛЬТАТЫ СРАВНЕНИЯ (тест на {results['test_period_days']} дней)")
    print(f"Общее количество точек данных: {results['data_points']}")

    print(f"\n🏆 ЛУЧШАЯ МОДЕЛЬ: {results['best_model'].upper()}")

    print(f"\n📈 ПОДРОБНЫЕ РЕЗУЛЬТАТЫ:")
    print("-" * 80)

    for model_type, result in results["model_results"].items():
        if not result.get("success", False):
            print(f"❌ {model_type.upper()}: {result.get('error', 'Неизвестная ошибка')}")
            continue

        metrics = result["metrics"]
        print(f"\n✅ {model_type.upper()} ({result['model_name']})")
        print(".2f")
        print(".1f")
        print(".4f")
        print(f"   Качество прогноза: {'Хорошее' if metrics.get('forecast_7d_quality') else 'Требует улучшения'}")
        print(f"   Тренд: {result['trend']}")

    # Сводка
    summary = results["comparison_summary"]
    print(f"\n📊 СВОДКА:")
    print(f"Всего протестировано моделей: {summary['total_models_tested']}")
    print(f"Успешных моделей: {summary['successful_models']}")

    if summary["best_accuracy"]["model"]:
        acc = summary["best_accuracy"]
        print(".2f"
              ".1f")

    if summary["fastest_model"]["model"]:
        fast = summary["fastest_model"]
        print(".4f"
              "")

    print(f"\n🎯 РЕКОМЕНДАЦИЯ:")
    recommendation = comparator.get_model_recommendation(results)
    print(f"Рекомендуемая модель: {recommendation['recommended_model'].upper()}")
    print(f"Уверенность: {recommendation['confidence']}")
    print("Причины:"    for reason in recommendation["reasoning"]:
        print(f"  • {reason}")

    if recommendation["alternative_models"]:
        print(f"Альтернативы: {', '.join(recommendation['alternative_models'])}")


if __name__ == "__main__":
    compare_models_demo()

