"""
Система рекомендаций: Оптимист и Пессимист
Согласно документу "Детализация бизнес-логики для Рекомендаций"
"""
from typing import Dict
from enum import Enum
from dataclasses import dataclass


class Scenario(str, Enum):
    """Сценарии"""
    OPTIMIST = "optimist"
    PESSIMIST = "pessimist"


class Action(str, Enum):
    """Действия"""
    INCREASE = "increase"
    DECREASE = "decrease"
    HOLD = "hold"


@dataclass
class Recommendation:
    """Рекомендация"""
    action: Action
    percentage: float
    timeframe: str
    confidence: float
    reasoning: str
    
    def to_dict(self) -> dict:
        return {
            "price_action": self.action.value,
            "percentage": round(self.percentage, 1),
            "timeframe": self.timeframe,
            "confidence": round(self.confidence, 3),
            "reasoning": self.reasoning
        }


class RecommendationEngine:
    """
    Движок рекомендаций
    Реализует точную логику из документа
    """
    
    @staticmethod
    def generate_optimist_recommendation(
        current_price: float,
        forecast_7d: float,
        forecast_30d: float,
        confidence: float,
        volatility: float
    ) -> Recommendation:
        """
        СЦЕНАРИЙ "ОПТИМИСТ" (агрессивный)
        
        Логика из документа:
        
        ЕСЛИ прогноз_7д > текущая + 5%:
            recommendation = "increase"
            percentage = min(25%, (прогноз_7д - текущая) × 0.7)
            timeframe = "1-3 дня"
        
        ИНАЧЕ ЕСЛИ прогноз_30д > текущая + 8%:
            recommendation = "hold"
            percentage = 0
            timeframe = "7-14 дней"
        
        ИНАЧЕ:
            recommendation = "decrease"
            percentage = min(15%, (текущая - прогноз_7д) × 0.5)
            timeframe = "сейчас"
        """
        
        # Расчёт изменения цены
        change_7d_pct = ((forecast_7d - current_price) / current_price) * 100
        change_30d_pct = ((forecast_30d - current_price) / current_price) * 100
        
        # УСЛОВИЕ 1: Рост > 5% через 7 дней
        if change_7d_pct > 5:
            percentage = min(25.0, abs(change_7d_pct) * 0.7)
            recommendation = Recommendation(
                action=Action.INCREASE,
                percentage=percentage,
                timeframe="1-3 дня",
                confidence=confidence,
                reasoning=(
                    f"Прогноз показывает рост на {change_7d_pct:.1f}% через 7 дней. "
                    f"Агрессивно поднимаем цену на {percentage:.1f}% для максимизации прибыли."
                )
            )
        
        # УСЛОВИЕ 2: Рост > 8% через 30 дней
        elif change_30d_pct > 8:
            recommendation = Recommendation(
                action=Action.HOLD,
                percentage=0,
                timeframe="7-14 дней",
                confidence=confidence,
                reasoning=(
                    f"Прогноз на 30 дней показывает рост на {change_30d_pct:.1f}%. "
                    f"Ждём более сильного роста в течение 7-14 дней."
                )
            )
        
        # УСЛОВИЕ 3: Иначе - снижение
        else:
            decrease_amount = abs(current_price - forecast_7d) / current_price * 100
            percentage = min(15.0, decrease_amount * 0.5)
            recommendation = Recommendation(
                action=Action.DECREASE,
                percentage=percentage,
                timeframe="сейчас",
                confidence=confidence,
                reasoning=(
                    f"Цена может упасть. Срочно снижаем на {percentage:.1f}% "
                    f"для сохранения конкурентоспособности."
                )
            )
        
        # Корректировка на основе уверенности (из документа)
        recommendation = RecommendationEngine._apply_confidence_corrections_optimist(
            recommendation, confidence, volatility
        )
        
        return recommendation
    
    @staticmethod
    def generate_pessimist_recommendation(
        current_price: float,
        forecast_7d: float,
        forecast_30d: float,
        confidence: float,
        volatility: float
    ) -> Recommendation:
        """
        СЦЕНАРИЙ "ПЕССИМИСТ" (консервативный)
        
        Логика из документа:
        
        ЕСЛИ прогноз_7д > текущая + 8% И confidence > 0.8:
            recommendation = "increase"
            percentage = min(15%, (прогноз_7д - текущая) × 0.5)
            timeframe = "3-7 дней"
        
        ИНАЧЕ ЕСЛИ прогноз_7д < текущая - 3%:
            recommendation = "decrease"
            percentage = min(10%, (текущая - прогноз_7д) × 0.8)
            timeframe = "немедленно"
        
        ИНАЧЕ:
            recommendation = "hold"
            percentage = 0
            timeframe = "наблюдать 7 дней"
        """
        
        change_7d_pct = ((forecast_7d - current_price) / current_price) * 100
        
        # УСЛОВИЕ 1: Рост > 8% И высокая уверенность
        if change_7d_pct > 8 and confidence > 0.8:
            percentage = min(15.0, abs(change_7d_pct) * 0.5)
            recommendation = Recommendation(
                action=Action.INCREASE,
                percentage=percentage,
                timeframe="3-7 дней",
                confidence=confidence,
                reasoning=(
                    f"Уверенный рост на {change_7d_pct:.1f}%. "
                    f"Осторожно повышаем цену на {percentage:.1f}% в течение 3-7 дней."
                )
            )
        
        # УСЛОВИЕ 2: Падение > 3%
        elif change_7d_pct < -3:
            decrease_amount = abs(change_7d_pct)
            percentage = min(10.0, decrease_amount * 0.8)
            recommendation = Recommendation(
                action=Action.DECREASE,
                percentage=percentage,
                timeframe="немедленно",
                confidence=confidence,
                reasoning=(
                    f"Прогноз падения на {abs(change_7d_pct):.1f}%. "
                    f"Для минимизации рисков снижаем цену на {percentage:.1f}% немедленно."
                )
            )
        
        # УСЛОВИЕ 3: Иначе - держать
        else:
            recommendation = Recommendation(
                action=Action.HOLD,
                percentage=0,
                timeframe="наблюдать 7 дней",
                confidence=confidence,
                reasoning=(
                    "Недостаточно данных для уверенных действий. "
                    "Сохраняем текущую цену и наблюдаем 7 дней."
                )
            )
        
        # Корректировка на основе уверенности и волатильности
        recommendation = RecommendationEngine._apply_confidence_corrections_pessimist(
            recommendation, confidence, volatility
        )
        
        return recommendation
    
    @staticmethod
    def _apply_confidence_corrections_optimist(
        rec: Recommendation,
        confidence: float,
        volatility: float
    ) -> Recommendation:
        """
        Корректировки для оптимиста (из документа)
        
        Для "increase":
        ЕСЛИ confidence < 0.7: percentage = percentage × 0.5
        ЕСЛИ confidence < 0.5: recommendation = "hold"
        
        Для "decrease":
        ЕСЛИ confidence < 0.6: percentage = percentage × 0.3
        ЕСЛИ волатильность > 0.2: recommendation = "hold"
        """
        if rec.action == Action.INCREASE:
            if confidence < 0.5:
                rec.action = Action.HOLD
                rec.percentage = 0
                rec.reasoning += " (низкая уверенность - держим позицию)"
            elif confidence < 0.7:
                rec.percentage *= 0.5
                rec.timeframe += " (требует подтверждения)"
        
        elif rec.action == Action.DECREASE:
            if volatility > 0.2:
                rec.action = Action.HOLD
                rec.percentage = 0
                rec.reasoning = "Высокая волатильность - держим позицию до стабилизации"
            elif confidence < 0.6:
                rec.percentage *= 0.3
                rec.timeframe = "после дополнительного анализа"
        
        return rec
    
    @staticmethod
    def _apply_confidence_corrections_pessimist(
        rec: Recommendation,
        confidence: float,
        volatility: float
    ) -> Recommendation:
        """Корректировки для пессимиста (более консервативные)"""
        if rec.action == Action.INCREASE:
            if confidence < 0.6:
                rec.action = Action.HOLD
                rec.percentage = 0
                rec.reasoning = "Недостаточная уверенность для повышения цены - держим"
            elif confidence < 0.8:
                rec.percentage *= 0.6
        
        elif rec.action == Action.DECREASE:
            if volatility > 0.15:  # Более строгий порог
                rec.percentage *= 0.5
                rec.reasoning += " (с учётом волатильности)"
        
        return rec
    
    @classmethod
    def generate_recommendation(
        cls,
        current_price: float,
        forecast_7d: float,
        forecast_30d: float,
        confidence: float,
        volatility: float,
        scenario: Scenario
    ) -> Recommendation:
        """
        Главная функция генерации рекомендаций
        
        Args:
            current_price: Текущая цена
            forecast_7d: Прогноз на 7 дней
            forecast_30d: Прогноз на 30 дней
            confidence: Уверенность модели (0-1)
            volatility: Волатильность цен (0-1)
            scenario: OPTIMIST или PESSIMIST
        
        Returns:
            Recommendation
        """
        if scenario == Scenario.OPTIMIST:
            return cls.generate_optimist_recommendation(
                current_price, forecast_7d, forecast_30d, confidence, volatility
            )
        else:
            return cls.generate_pessimist_recommendation(
                current_price, forecast_7d, forecast_30d, confidence, volatility
            )


# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    print("🎯 Тестирование рекомендаций\n")
    
    # Тест 1: Оптимист - рост цены
    print("="*60)
    print("ТЕСТ 1: Оптимист - прогноз роста на 7%")
    print("="*60)
    
    rec = RecommendationEngine.generate_recommendation(
        current_price=50000,
        forecast_7d=53500,  # +7%
        forecast_30d=55000,
        confidence=0.85,
        volatility=0.05,
        scenario=Scenario.OPTIMIST
    )
    
    print(f"Действие: {rec.action.value}")
    print(f"Процент: {rec.percentage}%")
    print(f"Срок: {rec.timeframe}")
    print(f"Уверенность: {rec.confidence:.2f}")
    print(f"Обоснование: {rec.reasoning}")
    
    # Тест 2: Пессимист - падение цены
    print("\n" + "="*60)
    print("ТЕСТ 2: Пессимист - прогноз падения на 5%")
    print("="*60)
    
    rec2 = RecommendationEngine.generate_recommendation(
        current_price=50000,
        forecast_7d=47500,  # -5%
        forecast_30d=46000,
        confidence=0.75,
        volatility=0.08,
        scenario=Scenario.PESSIMIST
    )
    
    print(f"Действие: {rec2.action.value}")
    print(f"Процент: {rec2.percentage}%")
    print(f"Срок: {rec2.timeframe}")
    print(f"Уверенность: {rec2.confidence:.2f}")
    print(f"Обоснование: {rec2.reasoning}")
    
    print("\nJSON:")
    import json
    print(json.dumps(rec.to_dict(), indent=2, ensure_ascii=False))
