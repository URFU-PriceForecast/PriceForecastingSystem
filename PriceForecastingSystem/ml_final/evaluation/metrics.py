"""
Система метрик для оценки ML моделей
Согласно документу "Метрики для проверки алгоритмов"
"""
import numpy as np
from typing import List, Dict
from dataclasses import dataclass


@dataclass
class MetricsResult:
    """Результат оценки метрик"""
    mape: float                      # Mean Absolute Percentage Error
    direction_accuracy: float        # Точность предсказания направления
    inference_time: float           # Время генерации прогноза
    forecast_7d_quality: bool       # Качество 7-дневного прогноза
    
    # Целевые значения
    mape_target: float = 15.0       # < 15%
    direction_target: float = 65.0  # > 65%
    time_target: float = 2.0        # < 2 сек
    
    def is_good_quality(self) -> bool:
        """Проверка соответствия целевым значениям"""
        return (
            self.mape < self.mape_target and
            self.direction_accuracy > self.direction_target and
            self.inference_time < self.time_target
        )
    
    def to_dict(self) -> dict:
        return {
            "mape": round(self.mape, 2),
            "mape_target": self.mape_target,
            "mape_ok": self.mape < self.mape_target,
            "direction_accuracy": round(self.direction_accuracy, 2),
            "direction_target": self.direction_target,
            "direction_ok": self.direction_accuracy > self.direction_target,
            "inference_time": round(self.inference_time, 4),
            "time_target": self.time_target,
            "time_ok": self.inference_time < self.time_target,
            "forecast_7d_quality": self.forecast_7d_quality,
            "overall_quality": self.is_good_quality()
        }


class MetricsEvaluator:
    """Класс для вычисления метрик"""
    
    @staticmethod
    def calculate_mape(actual: List[float], predicted: List[float]) -> float:
        """
        1. MAPE (Mean Absolute Percentage Error)
        
        Формула: (1/n) × Σ|(фактическая - прогноз) / фактическая| × 100%
        Целевое значение: < 15%
        """
        if len(actual) != len(predicted):
            raise ValueError("Длины массивов должны совпадать")
        
        if len(actual) == 0:
            return 100.0
        
        actual_arr = np.array(actual)
        predicted_arr = np.array(predicted)
        
        # Избегаем деления на ноль
        mask = actual_arr != 0
        if not mask.any():
            return 100.0
        
        mape = np.mean(np.abs((actual_arr[mask] - predicted_arr[mask]) / actual_arr[mask])) * 100
        return float(mape)
    
    @staticmethod
    def calculate_direction_accuracy(
        actual: List[float], 
        predicted: List[float]
    ) -> float:
        """
        2. Direction Accuracy
        
        Что измеряет: % правильных предсказаний направления (рост/падение)
        Целевое значение: > 65%
        """
        if len(actual) < 2 or len(predicted) < 2:
            return 0.0
        
        if len(actual) != len(predicted):
            raise ValueError("Длины массивов должны совпадать")
        
        # Вычисляем направления
        actual_directions = np.diff(actual) > 0  # True = рост, False = падение
        predicted_directions = np.diff(predicted) > 0
        
        # Процент совпадений
        correct = np.sum(actual_directions == predicted_directions)
        total = len(actual_directions)
        
        accuracy = (correct / total) * 100
        return float(accuracy)
    
    @staticmethod
    def evaluate_forecast_7d_quality(
        actual_7d: List[float],
        predicted_7d: List[float],
        inference_time: float
    ) -> bool:
        """
        5. 7-Day Forecast Quality
        
        Критерии: MAPE < 12% И Direction Accuracy > 60% И Time < 2 сек
        """
        if len(actual_7d) != 7 or len(predicted_7d) != 7:
            return False
        
        mape = MetricsEvaluator.calculate_mape(actual_7d, predicted_7d)
        direction = MetricsEvaluator.calculate_direction_accuracy(actual_7d, predicted_7d)
        
        return mape < 12.0 and direction > 60.0 and inference_time < 2.0
    
    @staticmethod
    def evaluate_model(
        actual: List[float],
        predicted: List[float],
        inference_time: float
    ) -> MetricsResult:
        """Полная оценка модели"""
        
        mape = MetricsEvaluator.calculate_mape(actual, predicted)
        direction = MetricsEvaluator.calculate_direction_accuracy(actual, predicted)
        
        # Для 7-дневного прогноза берём первые 7 дней
        actual_7d = actual[:7] if len(actual) >= 7 else actual
        predicted_7d = predicted[:7] if len(predicted) >= 7 else predicted
        
        forecast_7d = MetricsEvaluator.evaluate_forecast_7d_quality(
            actual_7d, predicted_7d, inference_time
        )
        
        return MetricsResult(
            mape=mape,
            direction_accuracy=direction,
            inference_time=inference_time,
            forecast_7d_quality=forecast_7d
        )


# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    # Тестовые данные
    actual = [100, 102, 105, 103, 107, 110, 108, 112]
    predicted = [100, 103, 104, 105, 106, 109, 110, 111]
    
    print("📊 Тестирование метрик\n")
    
    evaluator = MetricsEvaluator()
    
    # Отдельные метрики
    mape = evaluator.calculate_mape(actual, predicted)
    direction = evaluator.calculate_direction_accuracy(actual, predicted)
    
    print(f"MAPE: {mape:.2f}% (цель: < 15%)")
    print(f"Direction Accuracy: {direction:.2f}% (цель: > 65%)")
    
    # Полная оценка
    metrics = evaluator.evaluate_model(actual, predicted, inference_time=0.05)
    
    print(f"\n✅ Общая оценка:")
    print(f"  Качество модели: {'ХОРОШЕЕ' if metrics.is_good_quality() else 'ТРЕБУЕТ УЛУЧШЕНИЯ'}")
    print(f"  7-дневный прогноз: {'✓' if metrics.forecast_7d_quality else '✗'}")
    
    print(f"\nJSON:")
    import json
    print(json.dumps(metrics.to_dict(), indent=2, ensure_ascii=False))
