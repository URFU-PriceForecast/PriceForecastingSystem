"""
ML API Сервис - Полная интеграция
Объединяет все компоненты: модели, метрики, уверенность, рекомендации
"""
import sys
import os
from typing import List, Dict
from datetime import datetime
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))

from models.forecast_models import get_model
from evaluation.metrics import MetricsEvaluator
from evaluation.model_comparison import ModelComparison
from services.confidence import ConfidenceCalculator
from services.recommendations import RecommendationEngine, Scenario


class MLForecastService:
    """
    Главный сервис ML прогнозирования
    
    Это то, что будет вызываться из .NET backend
    """
    
    def __init__(self, model_type: str = "auto"):
        """
        Args:
            model_type: Тип модели ("naive", "ma", "linear", "arima", "exponential", "auto")
                        "auto" - автоматический выбор лучшей модели
        """
        self.model_type = model_type
        self.model_comparison = ModelComparison() if model_type == "auto" else None
    
    def generate_forecast(
        self,
        price_history: List[float],
        dates: List[datetime],
        scenario: str = "optimist",
        forecast_days: int = 7
    ) -> Dict:
        """
        ГЛАВНАЯ ФУНКЦИЯ - Генерация полного прогноза
        
        Args:
            price_history: История цен [50000, 51000, ...]
            dates: Даты истории [datetime(...), ...]
            scenario: "optimist" или "pessimist"
            forecast_days: Количество дней прогноза (7, 30, 90)
        
        Returns:
            {
                "forecast": {
                    "predictions": [...],
                    "dates": [...],
                    "trend": "up/down/stable"
                },
                "metrics": {
                    "inference_time": 0.05,
                    "model_name": "Linear Extrapolation"
                },
                "confidence": {
                    "value": 0.85,
                    "level": "высокая уверенность",
                    "components": {...}
                },
                "recommendation": {
                    "price_action": "increase/decrease/hold",
                    "percentage": 5.0,
                    "timeframe": "1-3 дня",
                    "confidence": 0.85,
                    "reasoning": "..."
                }
            }
        """
        
        if not price_history or not dates:
            raise ValueError("История цен и даты не могут быть пустыми")
        
        # 1. ПРОГНОЗ
        if self.model_type == "auto" and len(price_history) >= 20:
            # Автоматический выбор модели
            comparison_results = self.model_comparison.compare_models(
                price_history, dates, test_days=min(30, len(price_history)//2)
            )
            best_model_type = comparison_results["best_model"]
            print(f"Auto-selected model: {best_model_type}")
            forecast_result = get_model(best_model_type).predict(price_history, dates, days_ahead=forecast_days)
        else:
            # Ручной выбор модели или fallback
            model_type = self.model_type if self.model_type != "auto" else "linear"
            forecast_result = get_model(model_type).predict(price_history, dates, days_ahead=forecast_days)
        
        # 2. УВЕРЕННОСТЬ
        volatility = np.std(price_history) / np.mean(price_history) if price_history else 0
        
        # Для MAPE используем упрощённую оценку на обучении
        # (в реальности нужны исторические прогнозы)
        estimated_mape = 10.0  # Оценочное значение, можно улучшить
        
        confidence_result = ConfidenceCalculator.calculate_confidence(
            price_history=price_history,
            mape=estimated_mape
        )
        
        # 3. РЕКОМЕНДАЦИИ
        current_price = price_history[-1]
        
        # Прогнозы на разные периоды
        forecast_7d = forecast_result.predictions[min(6, len(forecast_result.predictions)-1)]
        
        # Для 30-дневного прогноза можем экстраполировать или использовать тренд
        if len(forecast_result.predictions) >= 30:
            forecast_30d = forecast_result.predictions[29]
        else:
            # Экстраполируем тренд
            if forecast_result.trend == "up":
                forecast_30d = forecast_7d * 1.05
            elif forecast_result.trend == "down":
                forecast_30d = forecast_7d * 0.95
            else:
                forecast_30d = forecast_7d
        
        scenario_enum = Scenario.OPTIMIST if scenario == "optimist" else Scenario.PESSIMIST
        
        recommendation = RecommendationEngine.generate_recommendation(
            current_price=current_price,
            forecast_7d=forecast_7d,
            forecast_30d=forecast_30d,
            confidence=confidence_result.final_confidence,
            volatility=volatility,
            scenario=scenario_enum
        )
        
        # 4. ФОРМИРУЕМ РЕЗУЛЬТАТ
        result = {
            "forecast": {
                "predictions": [round(p, 2) for p in forecast_result.predictions],
                "dates": [d.isoformat() for d in forecast_result.dates],
                "trend": forecast_result.trend,
                "period_days": forecast_days
            },
            "metrics": {
                "inference_time": round(forecast_result.inference_time, 4),
                "model_name": forecast_result.model_name,
                "model_selection": self.model_type
            },
            "confidence": {
                "value": round(confidence_result.final_confidence, 3),
                "level": confidence_result.level,
                "components": {
                    "data_quality": round(confidence_result.data_quality, 3),
                    "model_quality": round(confidence_result.model_quality, 3),
                    "external_factors": round(confidence_result.external_factors, 3)
                }
            },
            "recommendation": {
                "price_action": recommendation.action.value,
                "percentage": round(recommendation.percentage, 1),
                "timeframe": recommendation.timeframe,
                "confidence": round(recommendation.confidence, 3),
                "reasoning": recommendation.reasoning,
                "scenario": scenario
            },
            "current_price": round(current_price, 2)
        }


# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("🧪 ТЕСТИРОВАНИЕ ML FORECAST SERVICE")
    print("="*80)
    
    # Генерируем тестовые данные
    from datetime import timedelta
    
    dates = [datetime.now() - timedelta(days=30-i) for i in range(30)]
    
    # Симулируем рост цены
    prices = [50000 + i * 200 + np.random.normal(0, 500) for i in range(30)]
    
    # Создаём сервис
    service = MLForecastService(model_type="linear")
    
    # ТЕСТ 1: Оптимист
    print("\n" + "="*80)
    print("ТЕСТ 1: Сценарий ОПТИМИСТ")
    print("="*80)
    
    result = service.generate_forecast(
        price_history=prices,
        dates=dates,
        scenario="optimist",
        forecast_days=7
    )
    
    print(f"\n📊 Прогноз:")
    print(f"  Тренд: {result['forecast']['trend']}")
    print(f"  Первый прогноз: {result['forecast']['predictions'][0]:.2f}")
    print(f"  Последний прогноз (7д): {result['forecast']['predictions'][-1]:.2f}")
    
    print(f"\n🎯 Уверенность:")
    print(f"  Значение: {result['confidence']['value']}")
    print(f"  Уровень: {result['confidence']['level']}")
    
    print(f"\n💡 Рекомендация:")
    print(f"  Действие: {result['recommendation']['price_action']}")
    print(f"  Процент: {result['recommendation']['percentage']}%")
    print(f"  Срок: {result['recommendation']['timeframe']}")
    print(f"  Обоснование: {result['recommendation']['reasoning']}")
    
    # ТЕСТ 2: Пессимист
    print("\n" + "="*80)
    print("ТЕСТ 2: Сценарий ПЕССИМИСТ")
    print("="*80)
    
    result2 = service.generate_forecast(
        price_history=prices,
        dates=dates,
        scenario="pessimist",
        forecast_days=7
    )
    
    print(f"\n💡 Рекомендация:")
    print(f"  Действие: {result2['recommendation']['price_action']}")
    print(f"  Процент: {result2['recommendation']['percentage']}%")
    print(f"  Срок: {result2['recommendation']['timeframe']}")
    print(f"  Обоснование: {result2['recommendation']['reasoning']}")
    
    # JSON
    print("\n" + "="*80)
    print("JSON ОТВЕТ (для .NET backend):")
    print("="*80)
    
    import json
    print(json.dumps(result, indent=2, ensure_ascii=False))
