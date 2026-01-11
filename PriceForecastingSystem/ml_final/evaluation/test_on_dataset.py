"""
Тестирование ML моделей на искусственном датасете
Проверка работы всех алгоритмов и метрик
"""
import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime

# Добавляем пути
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.forecast_models import get_model, NaiveModel, MovingAverageModel, LinearExtrapolationModel
from evaluation.metrics import MetricsEvaluator
from services.confidence import ConfidenceCalculator
from services.recommendations import RecommendationEngine, Scenario


def load_dataset():
    """Загрузка датасета"""
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    
    price_history = pd.read_csv(os.path.join(data_dir, 'price_history_dataset.csv'))
    products = pd.read_csv(os.path.join(data_dir, 'products_dataset.csv'))
    
    return price_history, products


def test_model_on_product(
    price_history_df: pd.DataFrame,
    product_id: int,
    model_type: str = "linear",
    test_days: int = 7
):
    """
    Тестирование модели на одном товаре
    
    Args:
        price_history_df: DataFrame с историей цен
        product_id: ID товара
        model_type: Тип модели
        test_days: Сколько дней использовать для теста
    
    Returns:
        dict с результатами
    """
    # Получаем историю цен товара
    product_prices = price_history_df[price_history_df['product_id'] == product_id].copy()
    product_prices['created_at'] = pd.to_datetime(product_prices['created_at'])
    product_prices = product_prices.sort_values('created_at')
    
    if len(product_prices) < 14:
        return None
    
    # Разделяем на обучение и тест
    # Берём последние test_days дней как тест, остальное - обучение
    train_data = product_prices.iloc[:-test_days]
    test_data = product_prices.iloc[-test_days:]
    
    train_prices = train_data['price'].tolist()
    train_dates = train_data['created_at'].tolist()
    
    actual_prices = test_data['price'].tolist()
    actual_dates = test_data['created_at'].tolist()
    
    # Делаем прогноз
    model = get_model(model_type)
    
    try:
        forecast = model.predict(train_prices, train_dates, days_ahead=test_days)
    except Exception as e:
        print(f"  ❌ Ошибка прогноза для товара {product_id}: {e}")
        return None
    
    predicted_prices = forecast.predictions
    
    # Вычисляем метрики
    metrics = MetricsEvaluator.evaluate_model(
        actual=actual_prices,
        predicted=predicted_prices,
        inference_time=forecast.inference_time
    )
    
    # Вычисляем уверенность
    volatility = np.std(train_prices) / np.mean(train_prices) if train_prices else 0
    
    confidence_result = ConfidenceCalculator.calculate_confidence(
        price_history=train_prices,
        mape=metrics.mape
    )
    
    # Генерируем рекомендации
    current_price = train_prices[-1]
    forecast_7d = predicted_prices[min(6, len(predicted_prices)-1)]
    forecast_30d = forecast_7d * 1.02  # Упрощение для примера
    
    rec_optimist = RecommendationEngine.generate_recommendation(
        current_price=current_price,
        forecast_7d=forecast_7d,
        forecast_30d=forecast_30d,
        confidence=confidence_result.final_confidence,
        volatility=volatility,
        scenario=Scenario.OPTIMIST
    )
    
    rec_pessimist = RecommendationEngine.generate_recommendation(
        current_price=current_price,
        forecast_7d=forecast_7d,
        forecast_30d=forecast_30d,
        confidence=confidence_result.final_confidence,
        volatility=volatility,
        scenario=Scenario.PESSIMIST
    )
    
    return {
        'product_id': product_id,
        'model': model.name,
        'metrics': metrics,
        'confidence': confidence_result,
        'recommendation_optimist': rec_optimist,
        'recommendation_pessimist': rec_pessimist,
        'actual_prices': actual_prices,
        'predicted_prices': predicted_prices
    }


def run_full_test():
    """Полное тестирование на всём датасете"""
    print("="*80)
    print("🧪 ТЕСТИРОВАНИЕ ML МОДЕЛЕЙ НА ДАТАСЕТЕ")
    print("="*80)
    
    # Загружаем данные
    print("\n📊 Загрузка датасета...")
    price_history, products = load_dataset()
    
    print(f"  Товаров: {len(products)}")
    print(f"  Записей истории: {len(price_history)}")
    
    # Тестируем каждую модель
    models = ["naive", "ma", "linear"]
    
    for model_type in models:
        print(f"\n{'='*80}")
        print(f"🤖 МОДЕЛЬ: {model_type.upper()}")
        print("="*80)
        
        results = []
        
        # Тестируем на первых 10 товарах
        for product_id in range(1, 11):
            result = test_model_on_product(price_history, product_id, model_type, test_days=7)
            
            if result:
                results.append(result)
        
        if not results:
            print("  ❌ Нет результатов")
            continue
        
        # Агрегируем метрики
        mapes = [r['metrics'].mape for r in results]
        directions = [r['metrics'].direction_accuracy for r in results]
        times = [r['metrics'].inference_time for r in results]
        confidences = [r['confidence'].final_confidence for r in results]
        
        print(f"\n📊 МЕТРИКИ (на {len(results)} товарах):")
        print(f"  MAPE:")
        print(f"    Среднее: {np.mean(mapes):.2f}% (цель: < 15%)")
        print(f"    Мин/Макс: {np.min(mapes):.2f}% / {np.max(mapes):.2f}%")
        print(f"    ✓ Соответствует цели: {np.mean(mapes) < 15}")
        
        print(f"\n  Direction Accuracy:")
        print(f"    Среднее: {np.mean(directions):.2f}% (цель: > 65%)")
        print(f"    Мин/Макс: {np.min(directions):.2f}% / {np.max(directions):.2f}%")
        print(f"    ✓ Соответствует цели: {np.mean(directions) > 65}")
        
        print(f"\n  Inference Time:")
        print(f"    Среднее: {np.mean(times):.4f}с (цель: < 2с)")
        print(f"    Макс: {np.max(times):.4f}с")
        print(f"    ✓ Соответствует цели: {np.max(times) < 2.0}")
        
        print(f"\n  Уверенность системы:")
        print(f"    Среднее: {np.mean(confidences):.3f}")
        print(f"    Мин/Макс: {np.min(confidences):.3f} / {np.max(confidences):.3f}")
        
        # Пример рекомендаций
        print(f"\n💡 ПРИМЕР РЕКОМЕНДАЦИЙ (товар #{results[0]['product_id']}):")
        
        rec_opt = results[0]['recommendation_optimist']
        print(f"\n  Оптимист:")
        print(f"    Действие: {rec_opt.action.value}")
        print(f"    Процент: {rec_opt.percentage:.1f}%")
        print(f"    Срок: {rec_opt.timeframe}")
        print(f"    Обоснование: {rec_opt.reasoning}")
        
        rec_pes = results[0]['recommendation_pessimist']
        print(f"\n  Пессимист:")
        print(f"    Действие: {rec_pes.action.value}")
        print(f"    Процент: {rec_pes.percentage:.1f}%")
        print(f"    Срок: {rec_pes.timeframe}")
        print(f"    Обоснование: {rec_pes.reasoning}")
        
        # Проверка различия сценариев
        different_actions = sum(
            1 for r in results 
            if r['recommendation_optimist'].action != r['recommendation_pessimist'].action
        )
        scenario_diff = (different_actions / len(results)) * 100
        
        print(f"\n  Scenario Differentiation Score: {scenario_diff:.1f}%")
        print(f"    (цель: > 70% различий в рекомендациях)")
        print(f"    ✓ Соответствует цели: {scenario_diff > 70}")
    
    print(f"\n{'='*80}")
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("="*80)


if __name__ == "__main__":
    run_full_test()
