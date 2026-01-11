"""
Система расчёта уверенности (Confidence)
Согласно документу "Детализация бизнес-логики для Уверенности системы"
"""
import numpy as np
from typing import List, Dict
from dataclasses import dataclass


@dataclass
class ConfidenceComponents:
    """Компоненты уверенности"""
    data_quality: float      # Качество данных (0-1)
    model_quality: float     # Качество модели (0-1)
    external_factors: float  # Внешние факторы (0-1)
    final_confidence: float  # Итоговая уверенность (0-1)
    level: str              # Уровень: высокая/средняя/низкая
    
    def to_dict(self) -> dict:
        return {
            "data_quality": round(self.data_quality, 3),
            "model_quality": round(self.model_quality, 3),
            "external_factors": round(self.external_factors, 3),
            "confidence": round(self.final_confidence, 3),
            "confidence_level": self.level
        }


class ConfidenceCalculator:
    """
    Калькулятор уверенности системы
    
    Формула: confidence = 0.4 × качество_данных + 0.35 × качество_модели + 0.25 × внешние_факторы
    """
    
    # Веса компонентов
    WEIGHT_DATA = 0.40
    WEIGHT_MODEL = 0.35
    WEIGHT_EXTERNAL = 0.25
    
    @staticmethod
    def calculate_data_quality(
        price_history: List[float],
        successful_parses: int = None,
        total_parses: int = None
    ) -> float:
        """
        1. Качество данных (вес 40%)
        
        Компоненты:
        - полнота_истории = min(количество_точек / 30, 1.0)
        - стабильность_сбора = успешных_парсингов / общих_попыток
        - волатильность_цен = 1.0 - (std(последние_10) / средняя_цена)
        """
        if not price_history:
            return 0.0
        
        # 1.1 Полнота истории
        data_points = len(price_history)
        completeness = min(data_points / 30, 1.0)
        
        # 1.2 Стабильность сбора
        if successful_parses is not None and total_parses is not None and total_parses > 0:
            stability = successful_parses / total_parses
        else:
            stability = 1.0  # Предполагаем стабильность если нет данных
        
        # 1.3 Волатильность цен (последние 10 точек или все если меньше)
        recent_prices = price_history[-10:] if len(price_history) >= 10 else price_history
        if len(recent_prices) > 1:
            std = np.std(recent_prices)
            mean = np.mean(recent_prices)
            volatility_score = 1.0 - min(std / mean, 1.0) if mean > 0 else 0.5
        else:
            volatility_score = 0.5
        
        # Средневзвешенное
        data_quality = (completeness + stability + volatility_score) / 3
        return float(data_quality)
    
    @staticmethod
    def calculate_model_quality(
        mape: float,
        forecast_correlation: float = None,
        stability_score: float = None
    ) -> float:
        """
        2. Качество модели (вес 35%)
        
        Компоненты:
        - точность_на_истории = 1.0 - MAPE
        - согласованность_прогнозов = корреляция между прогнозами
        - стабильность_модели = 1.0 - |текущая - средняя точность|
        """
        # 2.1 Точность на истории
        accuracy_score = 1.0 - min(mape / 100, 1.0)
        
        # 2.2 Согласованность прогнозов
        if forecast_correlation is not None:
            consistency = forecast_correlation
        else:
            consistency = 0.8  # Предполагаем хорошую согласованность
        
        # 2.3 Стабильность модели
        if stability_score is not None:
            stability = stability_score
        else:
            stability = 0.9  # Предполагаем стабильность
        
        # Средневзвешенное
        model_quality = (accuracy_score + consistency + stability) / 3
        return float(model_quality)
    
    @staticmethod
    def calculate_external_factors(
        seasonal_match: float = None,
        category_reliability: float = None,
        market_stability: float = None
    ) -> float:
        """
        3. Внешние факторы (вес 25%)
        
        Компоненты:
        - сезонность = совпадение с историческими паттернами
        - категорийная_надежность = средняя точность по категории
        - рыночная_стабильность = 1.0 - волатильность похожих товаров
        """
        # Используем значения по умолчанию если не предоставлены
        seasonality = seasonal_match if seasonal_match is not None else 0.7
        category_rel = category_reliability if category_reliability is not None else 0.75
        market_stab = market_stability if market_stability is not None else 0.8
        
        external = (seasonality + category_rel + market_stab) / 3
        return float(external)
    
    @classmethod
    def calculate_confidence(
        cls,
        price_history: List[float],
        mape: float,
        successful_parses: int = None,
        total_parses: int = None,
        **kwargs
    ) -> ConfidenceComponents:
        """
        Главная функция расчёта уверенности
        
        Args:
            price_history: История цен
            mape: MAPE модели (в процентах)
            successful_parses: Количество успешных парсингов
            total_parses: Общее количество попыток парсинга
            **kwargs: Дополнительные параметры
        
        Returns:
            ConfidenceComponents с итоговой уверенностью
        """
        # 1. Качество данных
        data_quality = cls.calculate_data_quality(
            price_history, successful_parses, total_parses
        )
        
        # 2. Качество модели
        model_quality = cls.calculate_model_quality(
            mape, 
            kwargs.get('forecast_correlation'),
            kwargs.get('stability_score')
        )
        
        # 3. Внешние факторы
        external = cls.calculate_external_factors(
            kwargs.get('seasonal_match'),
            kwargs.get('category_reliability'),
            kwargs.get('market_stability')
        )
        
        # ИТОГОВАЯ ФОРМУЛА
        confidence = (
            cls.WEIGHT_DATA * data_quality +
            cls.WEIGHT_MODEL * model_quality +
            cls.WEIGHT_EXTERNAL * external
        )
        
        # Определяем уровень
        if confidence >= 0.9:
            level = "высокая уверенность"
        elif confidence >= 0.7:
            level = "средняя уверенность"
        elif confidence >= 0.5:
            level = "низкая уверенность"
        else:
            level = "очень низкая уверенность"
        
        return ConfidenceComponents(
            data_quality=data_quality,
            model_quality=model_quality,
            external_factors=external,
            final_confidence=confidence,
            level=level
        )


# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    print("📊 Тестирование расчёта уверенности\n")
    
    # Пример 1: Хорошие данные
    price_history = [50000 + i * 100 + np.random.normal(0, 200) for i in range(35)]
    mape = 8.5  # Хорошая точность
    
    confidence = ConfidenceCalculator.calculate_confidence(
        price_history=price_history,
        mape=mape,
        successful_parses=28,
        total_parses=30
    )
    
    print("Пример 1: Хорошие данные")
    print(f"  Качество данных: {confidence.data_quality:.3f}")
    print(f"  Качество модели: {confidence.model_quality:.3f}")
    print(f"  Внешние факторы: {confidence.external_factors:.3f}")
    print(f"  → Итоговая уверенность: {confidence.final_confidence:.3f}")
    print(f"  → Уровень: {confidence.level}")
    
    # Пример 2: Плохие данные
    price_history_bad = [50000 + np.random.normal(0, 5000) for i in range(10)]
    mape_bad = 25.0
    
    confidence_bad = ConfidenceCalculator.calculate_confidence(
        price_history=price_history_bad,
        mape=mape_bad,
        successful_parses=5,
        total_parses=10
    )
    
    print("\nПример 2: Плохие данные")
    print(f"  Качество данных: {confidence_bad.data_quality:.3f}")
    print(f"  Качество модели: {confidence_bad.model_quality:.3f}")
    print(f"  Внешние факторы: {confidence_bad.external_factors:.3f}")
    print(f"  → Итоговая уверенность: {confidence_bad.final_confidence:.3f}")
    print(f"  → Уровень: {confidence_bad.level}")
    
    print("\nJSON:")
    import json
    print(json.dumps(confidence.to_dict(), indent=2, ensure_ascii=False))
