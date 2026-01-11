"""
Визуализация разведочного анализа данных (EDA)
Создает графики для анализа ценовых данных
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import json


class EDAVisualizer:
    """
    Класс для создания визуализаций EDA ценовых данных
    """

    def __init__(self):
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (12, 8)
        plt.rcParams['font.size'] = 10

    def create_comprehensive_eda(
        self,
        prices: List[float],
        dates: List[datetime],
        article: str = "Unknown",
        save_path: str = None
    ) -> Dict:
        """
        Создает полный набор EDA визуализаций

        Args:
            prices: Список цен
            dates: Список дат
            article: Артикул товара
            save_path: Путь для сохранения графиков (опционально)

        Returns:
            Словарь с путями к графикам и статистикой
        """

        if len(prices) < 7:
            return {"error": "Недостаточно данных для анализа"}

        # Создаем DataFrame
        df = pd.DataFrame({
            'date': dates,
            'price': prices
        })
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')

        results = {
            "article": article,
            "data_points": len(prices),
            "date_range": {
                "start": dates[0].isoformat(),
                "end": dates[-1].isoformat()
            },
            "statistics": self._calculate_statistics(prices),
            "charts": {}
        }

        # 1. График временного ряда
        results["charts"]["price_time_series"] = self._create_price_time_series(df, save_path)

        # 2. График распределения цен
        results["charts"]["price_distribution"] = self._create_price_distribution(df, save_path)

        # 3. График волатильности
        results["charts"]["volatility_analysis"] = self._create_volatility_analysis(df, save_path)

        # 4. График тренда и сезонности
        results["charts"]["trend_seasonal"] = self._create_trend_seasonal_analysis(df, save_path)

        # 5. График автокорреляции
        results["charts"]["autocorrelation"] = self._create_autocorrelation_plot(df, save_path)

        return results

    def _calculate_statistics(self, prices: List[float]) -> Dict:
        """Вычисляет базовую статистику"""

        prices_array = np.array(prices)

        return {
            "mean": float(np.mean(prices_array)),
            "median": float(np.median(prices_array)),
            "std": float(np.std(prices_array)),
            "min": float(np.min(prices_array)),
            "max": float(np.max(prices_array)),
            "range": float(np.max(prices_array) - np.min(prices_array)),
            "cv": float(np.std(prices_array) / np.mean(prices_array)),  # Коэффициент вариации
            "skewness": float(self._calculate_skewness(prices_array)),
            "kurtosis": float(self._calculate_kurtosis(prices_array))
        }

    def _calculate_skewness(self, data: np.ndarray) -> float:
        """Вычисляет асимметрию распределения"""
        mean = np.mean(data)
        std = np.std(data)
        return np.mean(((data - mean) / std) ** 3)

    def _calculate_kurtosis(self, data: np.ndarray) -> float:
        """Вычисляет эксцесс распределения"""
        mean = np.mean(data)
        std = np.std(data)
        return np.mean(((data - mean) / std) ** 4) - 3

    def _create_price_time_series(self, df: pd.DataFrame, save_path: str = None) -> str:
        """Создает график временного ряда цен"""

        plt.figure(figsize=(14, 7))

        # Основной график
        plt.subplot(2, 1, 1)
        plt.plot(df.index, df['price'], linewidth=2, color='#2E86AB')
        plt.title('Динамика цен во времени', fontsize=14, fontweight='bold')
        plt.ylabel('Цена (руб.)')
        plt.grid(True, alpha=0.3)

        # Скользящее среднее
        plt.subplot(2, 1, 2)
        plt.plot(df.index, df['price'], alpha=0.5, color='gray', label='Исходные данные')
        ma_7 = df['price'].rolling(window=7).mean()
        ma_30 = df['price'].rolling(window=30).mean()
        plt.plot(df.index, ma_7, linewidth=2, color='#A23B72', label='MA(7 дней)')
        plt.plot(df.index, ma_30, linewidth=2, color='#F18F01', label='MA(30 дней)')
        plt.title('Скользящие средние', fontsize=14, fontweight='bold')
        plt.ylabel('Цена (руб.)')
        plt.legend()
        plt.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            filename = f"{save_path}/price_time_series.png"
            plt.savefig(filename, dpi=300, bbox_inches='tight')
            plt.close()
            return filename

        plt.close()
        return "price_time_series.png"

    def _create_price_distribution(self, df: pd.DataFrame, save_path: str = None) -> str:
        """Создает график распределения цен"""

        plt.figure(figsize=(12, 5))

        # Гистограмма
        plt.subplot(1, 2, 1)
        plt.hist(df['price'], bins=20, alpha=0.7, color='#2E86AB', edgecolor='black')
        plt.title('Распределение цен', fontsize=14, fontweight='bold')
        plt.xlabel('Цена (руб.)')
        plt.ylabel('Частота')
        plt.grid(True, alpha=0.3)

        # Box plot
        plt.subplot(1, 2, 2)
        plt.boxplot(df['price'], vert=False)
        plt.title('Box Plot цен', fontsize=14, fontweight='bold')
        plt.xlabel('Цена (руб.)')
        plt.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            filename = f"{save_path}/price_distribution.png"
            plt.savefig(filename, dpi=300, bbox_inches='tight')
            plt.close()
            return filename

        plt.close()
        return "price_distribution.png"

    def _create_volatility_analysis(self, df: pd.DataFrame, save_path: str = None) -> str:
        """Создает анализ волатильности"""

        plt.figure(figsize=(14, 6))

        # Волатильность (скользящее стандартное отклонение)
        plt.subplot(2, 1, 1)
        volatility = df['price'].rolling(window=7).std()
        plt.plot(df.index, volatility, linewidth=2, color='#A23B72')
        plt.title('Волатильность цен (7-дневное скользящее std)', fontsize=14, fontweight='bold')
        plt.ylabel('Волатильность (руб.)')
        plt.grid(True, alpha=0.3)

        # Изменения цен (разности)
        plt.subplot(2, 1, 2)
        price_changes = df['price'].diff().dropna()
        plt.plot(df.index[1:], price_changes, linewidth=1, color='#F18F01', alpha=0.7)
        plt.axhline(y=0, color='black', linestyle='--', alpha=0.5)
        plt.title('Дневные изменения цен', fontsize=14, fontweight='bold')
        plt.ylabel('Изменение цены (руб.)')
        plt.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            filename = f"{save_path}/volatility_analysis.png"
            plt.savefig(filename, dpi=300, bbox_inches='tight')
            plt.close()
            return filename

        plt.close()
        return "volatility_analysis.png"

    def _create_trend_seasonal_analysis(self, df: pd.DataFrame, save_path: str = None) -> str:
        """Создает анализ тренда и сезонности"""

        plt.figure(figsize=(14, 8))

        # Тренд (линейная регрессия)
        plt.subplot(2, 2, 1)
        x = np.arange(len(df))
        coeffs = np.polyfit(x, df['price'], 1)
        trend = coeffs[0] * x + coeffs[1]
        plt.plot(df.index, df['price'], alpha=0.5, color='gray', label='Данные')
        plt.plot(df.index, trend, linewidth=3, color='#2E86AB', label='Тренд')
        plt.title('Тренд цен', fontsize=12, fontweight='bold')
        plt.legend()
        plt.grid(True, alpha=0.3)

        # Сезонная декомпозиция (по дням недели, если достаточно данных)
        if len(df) >= 14:
            plt.subplot(2, 2, 2)
            df['day_of_week'] = df.index.dayofweek
            weekly_avg = df.groupby('day_of_week')['price'].mean()
            plt.plot(weekly_avg.index, weekly_avg.values, marker='o', linewidth=2, color='#A23B72')
            plt.title('Средние цены по дням недели', fontsize=12, fontweight='bold')
            plt.xlabel('День недели (0=Пн, 6=Вс)')
            plt.ylabel('Средняя цена')
            plt.grid(True, alpha=0.3)

        # Q-Q plot для нормальности
        plt.subplot(2, 2, 3)
        from scipy import stats
        prices_sorted = np.sort(df['price'])
        normal_quantiles = stats.norm.ppf(np.linspace(0.01, 0.99, len(prices_sorted)))
        plt.scatter(normal_quantiles, prices_sorted, alpha=0.6, color='#F18F01')
        # Линия идеального нормального распределения
        min_val, max_val = normal_quantiles.min(), normal_quantiles.max()
        plt.plot([min_val, max_val], [prices_sorted.min(), prices_sorted.max()],
                color='red', linestyle='--', alpha=0.7, label='Идеальная нормальность')
        plt.title('Q-Q Plot (проверка нормальности)', fontsize=12, fontweight='bold')
        plt.xlabel('Теоретические квантили')
        plt.ylabel('Наблюдаемые квантили')
        plt.legend()
        plt.grid(True, alpha=0.3)

        # ACF (автокорреляционная функция)
        plt.subplot(2, 2, 4)
        from statsmodels.graphics.tsaplots import plot_acf
        plot_acf(df['price'], lags=min(20, len(df)-1), ax=plt.gca(), color='#2E86AB')
        plt.title('Автокорреляционная функция', fontsize=12, fontweight='bold')
        plt.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            filename = f"{save_path}/trend_seasonal_analysis.png"
            plt.savefig(filename, dpi=300, bbox_inches='tight')
            plt.close()
            return filename

        plt.close()
        return "trend_seasonal_analysis.png"

    def _create_autocorrelation_plot(self, df: pd.DataFrame, save_path: str = None) -> str:
        """Создает график автокорреляции"""

        plt.figure(figsize=(12, 8))

        # ACF
        plt.subplot(2, 1, 1)
        from statsmodels.graphics.tsaplots import plot_acf
        plot_acf(df['price'], lags=min(30, len(df)-1), ax=plt.gca(), color='#2E86AB')
        plt.title('Автокорреляционная функция (ACF)', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)

        # PACF
        plt.subplot(2, 1, 2)
        from statsmodels.graphics.tsaplots import plot_pacf
        plot_pacf(df['price'], lags=min(30, len(df)-1), ax=plt.gca(), color='#A23B72')
        plt.title('Частичная автокорреляционная функция (PACF)', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            filename = f"{save_path}/autocorrelation.png"
            plt.savefig(filename, dpi=300, bbox_inches='tight')
            plt.close()
            return filename

        plt.close()
        return "autocorrelation.png"

    def generate_eda_report(self, eda_results: Dict) -> str:
        """Генерирует текстовый отчет по EDA"""

        stats = eda_results["statistics"]

        report = f"""
# Отчет по разведочному анализу данных (EDA)

## Общая информация
- **Артикул:** {eda_results["article"]}
- **Количество точек данных:** {eda_results["data_points"]}
- **Период анализа:** {eda_results["date_range"]["start"]} - {eda_results["date_range"]["end"]}

## Статистические характеристики

### Основные метрики
- **Средняя цена:** {stats["mean"]:,.0f} руб.
- **Медианная цена:** {stats["median"]:,.0f} руб.
- **Стандартное отклонение:** {stats["std"]:,.0f} руб.
- **Диапазон цен:** {stats["range"]:,.0f} руб. (от {stats["min"]:,.0f} до {stats["max"]:,.0f})

### Характеристики распределения
- **Коэффициент вариации:** {stats["cv"]:.3f} ({self._interpret_cv(stats["cv"])})
- **Асимметрия (Skewness):** {stats["skewness"]:.3f} ({self._interpret_skewness(stats["skewness"])})
- **Эксцесс (Kurtosis):** {stats["kurtosis"]:.3f} ({self._interpret_kurtosis(stats["kurtosis"])})

## Выводы и рекомендации

### Для моделирования:
{self._generate_modeling_recommendations(stats)}

### Риски ценообразования:
{self._generate_risk_assessment(stats)}

---
*Отчет создан автоматически системой EDA*
"""

        return report

    def _interpret_cv(self, cv: float) -> str:
        """Интерпретирует коэффициент вариации"""
        if cv < 0.1:
            return "очень низкая волатильность"
        elif cv < 0.2:
            return "низкая волатильность"
        elif cv < 0.3:
            return "средняя волатильность"
        else:
            return "высокая волатильность"

    def _interpret_skewness(self, skew: float) -> str:
        """Интерпретирует асимметрию"""
        if abs(skew) < 0.5:
            return "симметричное распределение"
        elif skew > 0:
            return "правосторонняя асимметрия"
        else:
            return "левосторонняя асимметрия"

    def _interpret_kurtosis(self, kurt: float) -> str:
        """Интерпретирует эксцесс"""
        if kurt < -0.5:
            return "плосковершинное распределение"
        elif kurt < 0.5:
            return "нормальное распределение"
        else:
            return "островершинное распределение"

    def _generate_modeling_recommendations(self, stats: Dict) -> str:
        """Генерирует рекомендации для моделирования"""
        recommendations = []

        if stats["cv"] > 0.3:
            recommendations.append("- Использовать модели, устойчивые к высокой волатильности (ARIMA, Exponential Smoothing)")
        else:
            recommendations.append("- Подходят простые модели (Linear Regression, Moving Average)")

        if abs(stats["skewness"]) > 1:
            recommendations.append("- Обратить внимание на асимметрию распределения при интерпретации прогнозов")

        if stats["kurtosis"] > 1:
            recommendations.append("- Высокая вероятность экстремальных значений - использовать robust модели")

        return "\n".join(recommendations)

    def _generate_risk_assessment(self, stats: Dict) -> str:
        """Генерирует оценку рисков"""
        risks = []

        if stats["cv"] > 0.4:
            risks.append("- Высокий риск убытков от неправильного ценообразования")
        elif stats["cv"] > 0.2:
            risks.append("- Средний уровень риска, требуется регулярный мониторинг")

        if stats["range"] / stats["mean"] > 0.5:
            risks.append("- Значительные колебания цен требуют осторожного подхода")

        if not risks:
            risks.append("- Стабильная ценовая ситуация, низкие риски")

        return "\n".join(risks)


def eda_demo():
    """Демонстрация EDA визуализации"""

    print("="*80)
    print("📊 ДЕМОНСТРАЦИЯ EDA ВИЗУАЛИЗАЦИИ")
    print("="*80)

    # Генерируем тестовые данные
    dates = pd.date_range(start='2024-08-01', end='2024-12-30', freq='D').tolist()

    # Создаем реалистичные ценовые данные
    np.random.seed(42)
    base_prices = [45000 + i * 20 + 500 * np.sin(2 * np.pi * i / 30) for i in range(len(dates))]
    noise = np.random.normal(0, 800, len(dates))

    # Добавляем тренд и сезонность
    trend = [i * 10 for i in range(len(dates))]
    seasonal = [300 * np.sin(2 * np.pi * i / 7) for i in range(len(dates))]

    prices = [base + noise + trend + season for base, noise, trend, season in zip(base_prices, noise, trend, seasonal)]

    # Создаем визуализатор
    visualizer = EDAVisualizer()

    # Выполняем EDA
    print("🔍 Выполняем разведочный анализ данных...")
    eda_results = visualizer.create_comprehensive_eda(prices, dates, article="TEST_482159736")

    print("✅ Анализ завершен!")

    # Выводим статистику
    stats = eda_results["statistics"]
    print(f"\n📈 СТАТИСТИКА:")
    print(f"  Период: {eda_results['date_range']['start']} - {eda_results['date_range']['end']}")
    print(f"  Количество точек: {eda_results['data_points']}")
    print(".0f")
    print(".0f")
    print(".3f")
    print(f"  Волатильность: {visualizer._interpret_cv(stats['cv'])}")

    # Генерируем отчет
    print("
📋 Генерируем отчет..."    report = visualizer.generate_eda_report(eda_results)

    print("\n" + "="*80)
    print("ОТЧЕТ ПО EDA")
    print("="*80)
    print(report)

    print("\n🎨 Созданные графики:")
    for chart_name, chart_path in eda_results["charts"].items():
        print(f"  • {chart_name}: {chart_path}")


if __name__ == "__main__":
    eda_demo()

