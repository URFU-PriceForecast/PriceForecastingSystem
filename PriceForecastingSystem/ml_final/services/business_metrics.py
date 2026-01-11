"""
Расчет бизнес-метрик влияния ML на ценообразование
Показывает ROI и влияние на маржинальность
"""
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class BusinessImpact:
    """Результаты влияния на бизнес"""
    roi_percentage: float  # ROI в процентах
    profit_increase: float  # Увеличение прибыли в рублях
    margin_improvement: float  # Улучшение маржинальности в %
    risk_reduction: float  # Снижение рисков в %
    payback_period_months: float  # Срок окупаемости в месяцах
    confidence_level: str  # Уровень уверенности расчета


class BusinessMetricsCalculator:
    """
    Калькулятор бизнес-метрик для оценки влияния ML на ценообразование
    """

    def __init__(self):
        self.baseline_scenarios = {
            "conservative": {
                "current_accuracy": 0.6,  # Текущая точность ценообразования
                "improvement_factor": 1.15,  # Коэффициент улучшения от ML
                "risk_reduction": 0.25  # Снижение рисков
            },
            "realistic": {
                "current_accuracy": 0.55,
                "improvement_factor": 1.25,
                "risk_reduction": 0.35
            },
            "optimistic": {
                "current_accuracy": 0.5,
                "improvement_factor": 1.4,
                "risk_reduction": 0.5
            }
        }

    def calculate_business_impact(
        self,
        monthly_revenue: float,
        monthly_orders: int,
        average_margin: float = 0.25,
        ml_accuracy: float = 0.85,
        scenario: str = "realistic",
        subscription_cost: float = 29000  # Стоимость подписки в месяц
    ) -> BusinessImpact:
        """
        Рассчитывает влияние ML на бизнес-метрики

        Args:
            monthly_revenue: Месячная выручка (руб.)
            monthly_orders: Количество заказов в месяц
            average_margin: Средняя маржинальность (0.25 = 25%)
            ml_accuracy: Точность ML модели (0.85 = 85%)
            scenario: Сценарий расчета ("conservative", "realistic", "optimistic")
            subscription_cost: Стоимость подписки (руб/месяц)

        Returns:
            BusinessImpact с детальными расчетами
        """

        if scenario not in self.baseline_scenarios:
            scenario = "realistic"

        baseline = self.baseline_scenarios[scenario]

        # 1. Расчет текущей прибыли
        current_profit = monthly_revenue * average_margin

        # 2. Расчет улучшения от ML
        accuracy_improvement = ml_accuracy - baseline["current_accuracy"]
        profit_multiplier = baseline["improvement_factor"] + (accuracy_improvement * 0.5)

        # Ограничения реализма
        profit_multiplier = min(profit_multiplier, 2.0)  # Не более 100% роста

        improved_profit = current_profit * profit_multiplier

        # 3. Расчет ROI
        profit_increase = improved_profit - current_profit
        roi_percentage = (profit_increase / subscription_cost) * 100

        # 4. Расчет срока окупаемости
        if profit_increase > 0:
            payback_period_months = subscription_cost / profit_increase
        else:
            payback_period_months = float('inf')

        # 5. Расчет улучшения маржинальности
        margin_improvement = ((improved_profit / monthly_revenue) - average_margin) * 100

        # 6. Расчет снижения рисков
        risk_reduction = baseline["risk_reduction"] * 100 * (ml_accuracy / 0.8)

        # 7. Определение уровня уверенности
        confidence_level = self._determine_confidence_level(
            monthly_revenue, monthly_orders, ml_accuracy, scenario
        )

        return BusinessImpact(
            roi_percentage=round(roi_percentage, 1),
            profit_increase=round(profit_increase, 0),
            margin_improvement=round(margin_improvement, 1),
            risk_reduction=round(risk_reduction, 1),
            payback_period_months=round(payback_period_months, 1) if payback_period_months != float('inf') else 999,
            confidence_level=confidence_level
        )

    def calculate_optimal_pricing_strategy(
        self,
        current_price: float,
        forecasted_prices: List[float],
        demand_elasticity: float = -1.5,
        competitor_prices: List[float] = None,
        business_goals: Dict = None
    ) -> Dict:
        """
        Рассчитывает оптимальную ценовую стратегию

        Args:
            current_price: Текущая цена
            forecasted_prices: Прогнозные цены
            demand_elasticity: Эластичность спроса
            competitor_prices: Цены конкурентов
            business_goals: Бизнес-цели ("max_profit", "market_share", "risk_minimization")

        Returns:
            Оптимальная ценовая стратегия
        """

        if business_goals is None:
            business_goals = {"primary": "max_profit"}

        strategy = {
            "recommended_price": current_price,
            "expected_profit_change": 0,
            "risk_level": "medium",
            "timeframe": "1-3 месяца",
            "reasoning": []
        }

        # Анализ тренда
        if len(forecasted_prices) >= 7:
            trend = np.polyfit(range(len(forecasted_prices)), forecasted_prices, 1)[0]

            if trend > 50:  # Рост цены
                if business_goals.get("primary") == "max_profit":
                    strategy["recommended_price"] = min(forecasted_prices[:7]) * 0.98  # Немного ниже прогноза
                    strategy["expected_profit_change"] = 15
                    strategy["reasoning"].append("Рыночный тренд роста - удерживать конкурентную цену")
                else:
                    strategy["recommended_price"] = current_price
                    strategy["reasoning"].append("Сохранение текущей цены для поддержания стабильности")

            elif trend < -50:  # Падение цены
                strategy["recommended_price"] = max(forecasted_prices[:7]) * 1.02  # Выше прогноза
                strategy["expected_profit_change"] = -10
                strategy["risk_level"] = "high"
                strategy["reasoning"].append("Рыночный тренд падения - осторожное повышение цены")

        # Анализ конкурентов
        if competitor_prices:
            avg_competitor = np.mean(competitor_prices)
            price_position = (current_price - avg_competitor) / avg_competitor * 100

            if price_position > 10:
                strategy["reasoning"].append(f"Цена на {price_position:.1f}% выше конкурентов - рассмотреть снижение")
            elif price_position < -10:
                strategy["reasoning"].append(f"Цена на {abs(price_position):.1f}% ниже конкурентов - возможность повышения")

        return strategy

    def simulate_pricing_scenarios(
        self,
        current_price: float,
        price_range: Tuple[float, float],
        demand_function: callable = None,
        cost_structure: Dict = None
    ) -> Dict:
        """
        Симулирует различные ценовые сценарии

        Args:
            current_price: Текущая цена
            price_range: Диапазон цен для симуляции (min, max)
            demand_function: Функция спроса (опционально)
            cost_structure: Структура затрат (опционально)

        Returns:
            Результаты симуляции различных сценариев
        """

        if demand_function is None:
            # Простая функция спроса с эластичностью -1.5
            def demand_function(price):
                base_demand = 1000
                elasticity = -1.5
                return base_demand * (current_price / price) ** elasticity

        if cost_structure is None:
            cost_structure = {
                "variable_cost": current_price * 0.6,  # 60% от цены
                "fixed_cost_per_unit": current_price * 0.1  # 10% от цены
            }

        # Генерируем тестовые цены
        test_prices = np.linspace(price_range[0], price_range[1], 20)

        scenarios = []

        for price in test_prices:
            demand = demand_function(price)
            revenue = price * demand

            total_variable_cost = cost_structure["variable_cost"] * demand
            total_fixed_cost = cost_structure["fixed_cost_per_unit"] * demand
            total_cost = total_variable_cost + total_fixed_cost

            profit = revenue - total_cost
            margin = (profit / revenue) * 100 if revenue > 0 else 0

            scenarios.append({
                "price": round(price, 2),
                "demand": round(demand, 0),
                "revenue": round(revenue, 0),
                "profit": round(profit, 0),
                "margin": round(margin, 1),
                "profit_change_percent": round((profit / (current_price * demand_function(current_price) - cost_structure["variable_cost"] * demand_function(current_price) - cost_structure["fixed_cost_per_unit"] * demand_function(current_price)) - 1) * 100, 1)
            })

        # Находим оптимальные сценарии
        max_profit_scenario = max(scenarios, key=lambda x: x["profit"])
        max_margin_scenario = max(scenarios, key=lambda x: x["margin"])
        current_scenario = next((s for s in scenarios if abs(s["price"] - current_price) < 1), scenarios[0])

        return {
            "scenarios": scenarios,
            "optimal_profit": max_profit_scenario,
            "optimal_margin": max_margin_scenario,
            "current_performance": current_scenario,
            "recommendations": self._generate_pricing_recommendations(
                current_scenario, max_profit_scenario, max_margin_scenario
            )
        }

    def _determine_confidence_level(
        self,
        revenue: float,
        orders: int,
        accuracy: float,
        scenario: str
    ) -> str:
        """Определяет уровень уверенности расчетов"""

        # Факторы уверенности
        data_quality = min(orders / 1000, 1)  # Качество данных на основе объема
        model_reliability = accuracy / 0.9  # Надежность модели

        confidence_score = (data_quality + model_reliability) / 2

        if scenario == "conservative":
            confidence_score *= 0.8
        elif scenario == "optimistic":
            confidence_score *= 1.2

        if confidence_score > 0.8:
            return "high"
        elif confidence_score > 0.6:
            return "medium"
        else:
            return "low"

    def _generate_pricing_recommendations(
        self,
        current: Dict,
        optimal_profit: Dict,
        optimal_margin: Dict
    ) -> List[str]:
        """Генерирует рекомендации по ценообразованию"""

        recommendations = []

        profit_diff = optimal_profit["profit"] - current["profit"]
        if profit_diff > current["profit"] * 0.1:  # > 10% улучшения
            recommendations.append(f"Рекомендуется повышение цены до {optimal_profit['price']} руб. для увеличения прибыли на {profit_diff:,.0f} руб.")

        margin_diff = optimal_margin["margin"] - current["margin"]
        if margin_diff > 5:  # > 5% улучшения маржи
            recommendations.append(f"Для максимизации маржи рассмотреть цену {optimal_margin['price']} руб. (маржа {optimal_margin['margin']}%)")

        if abs(current["price"] - optimal_profit["price"]) < current["price"] * 0.05:
            recommendations.append("Текущая цена близка к оптимальной")

        return recommendations


def business_metrics_demo():
    """Демонстрация расчета бизнес-метрик"""

    print("="*80)
    print("💼 ДЕМОНСТРАЦИЯ РАСЧЕТА БИЗНЕС-МЕТРИК")
    print("="*80)

    # Создаем калькулятор
    calculator = BusinessMetricsCalculator()

    # Тестовый бизнес
    monthly_revenue = 5000000  # 5 млн руб/месяц
    monthly_orders = 2500
    average_margin = 0.22  # 22%
    ml_accuracy = 0.85

    print("🏪 ПАРАМЕТРЫ БИЗНЕСА:")
    print(",.0f"    print(f"  Заказов в месяц: {monthly_orders}")
    print(".1%"    print(".0%"    print()

    # Рассчитываем влияние для разных сценариев
    scenarios = ["conservative", "realistic", "optimistic"]

    for scenario in scenarios:
        print(f"📊 СЦЕНАРИЙ: {scenario.upper()}")
        impact = calculator.calculate_business_impact(
            monthly_revenue=monthly_revenue,
            monthly_orders=monthly_orders,
            average_margin=average_margin,
            ml_accuracy=ml_accuracy,
            scenario=scenario
        )

        print("+.1f"        print(",.0f"        print("+.1f"        print("+.1f"        print(".1f"        print(f"  Уровень уверенности: {impact.confidence_level}")
        print()

    # Симуляция ценовых стратегий
    print("💰 СИМУЛЯЦИЯ ЦЕНОВЫХ СТРАТЕГИЙ")
    print("-"*50)

    current_price = 1800
    forecast_prices = [1750, 1780, 1820, 1850, 1800, 1780, 1760]  # Прогноз на неделю

    strategy = calculator.calculate_optimal_pricing_strategy(
        current_price=current_price,
        forecasted_prices=forecast_prices,
        business_goals={"primary": "max_profit"}
    )

    print(f"Текущая цена: {current_price} руб.")
    print(f"Рекомендуемая цена: {strategy['recommended_price']} руб.")
    print("+.1f"    print(f"Уровень риска: {strategy['risk_level']}")
    print(f"Временной горизонт: {strategy['timeframe']}")
    print("Обоснование:"    for reason in strategy["reasoning"]:
        print(f"  • {reason}")

    print()
    print("📈 ПОДРОБНЫЙ АНАЛИЗ СЦЕНАРИЯ 'REALISTIC':")
    impact = calculator.calculate_business_impact(
        monthly_revenue=monthly_revenue,
        monthly_orders=monthly_orders,
        average_margin=average_margin,
        ml_accuracy=ml_accuracy,
        scenario="realistic"
    )

    print(f"• Текущая прибыль: {monthly_revenue * average_margin:,.0f} руб/месяц")
    print("+.0f"    print("+.0f"    print(".1f"    print(".1f"    print(".1f"    print()
    print("🎯 ВЫВОДЫ:")
    print("• ML-платформа окупается за {:.1f} месяцев".format(impact.payback_period_months))
    print("• Ожидаемое увеличение прибыли: {:.0%}".format(impact.profit_increase / (monthly_revenue * average_margin)))
    print("• Снижение операционных рисков: {:.0%}".format(impact.risk_reduction / 100))


if __name__ == "__main__":
    business_metrics_demo()

