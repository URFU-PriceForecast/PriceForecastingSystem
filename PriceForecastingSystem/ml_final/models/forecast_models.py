"""
ML модели прогнозирования цен с метриками
Реализация согласно документу "Метрики для проверки алгоритмов"
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Tuple, Dict
from dataclasses import dataclass
import time
import warnings
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing

warnings.filterwarnings('ignore')


@dataclass
class ForecastResult:
    """Результат прогноза"""
    predictions: List[float]  # Прогнозные цены
    dates: List[datetime]      # Даты прогноза
    trend: str                 # up, down, stable
    model_name: str
    inference_time: float      # Время генерации (секунды)
    
    def to_dict(self) -> dict:
        return {
            "predictions": self.predictions,
            "dates": [d.isoformat() for d in self.dates],
            "trend": self.trend,
            "model_name": self.model_name,
            "inference_time": self.inference_time
        }


class BaseModel:
    """Базовый класс для моделей"""
    
    def __init__(self, name: str):
        self.name = name
    
    def predict(self, prices: List[float], dates: List[datetime], days_ahead: int = 7) -> ForecastResult:
        """Прогноз"""
        raise NotImplementedError
    
    def _detect_trend(self, prices: List[float]) -> str:
        """Определение тренда"""
        if len(prices) < 2:
            return "stable"
        
        # Линейная регрессия
        x = np.arange(len(prices))
        coeffs = np.polyfit(x, prices, 1)
        slope = coeffs[0]
        
        # Пороги
        threshold = np.mean(prices) * 0.001  # 0.1%
        
        if slope > threshold:
            return "up"
        elif slope < -threshold:
            return "down"
        return "stable"


class NaiveModel(BaseModel):
    """
    Алгоритм 1: Прогноз завтра = цена сегодня
    Самая простая базовая модель
    """
    
    def __init__(self):
        super().__init__("Naive (Tomorrow = Today)")
    
    def predict(self, prices: List[float], dates: List[datetime], days_ahead: int = 7) -> ForecastResult:
        start_time = time.time()
        
        if not prices:
            raise ValueError("Нет данных для прогноза")
        
        last_price = prices[-1]
        last_date = dates[-1]
        
        # Все дни - та же цена
        forecast_dates = [last_date + timedelta(days=i+1) for i in range(days_ahead)]
        forecast_prices = [last_price] * days_ahead
        
        inference_time = time.time() - start_time
        
        return ForecastResult(
            predictions=forecast_prices,
            dates=forecast_dates,
            trend=self._detect_trend(prices),
            model_name=self.name,
            inference_time=inference_time
        )


class MovingAverageModel(BaseModel):
    """
    Алгоритм 2: Скользящее среднее
    MA для сглаживания и прогноза
    """
    
    def __init__(self, window: int = 7):
        super().__init__(f"Moving Average (window={window})")
        self.window = window
    
    def predict(self, prices: List[float], dates: List[datetime], days_ahead: int = 7) -> ForecastResult:
        start_time = time.time()
        
        if len(prices) < self.window:
            raise ValueError(f"Недостаточно данных. Нужно минимум {self.window} точек")
        
        last_date = dates[-1]
        
        # Вычисляем скользящее среднее
        prices_array = np.array(prices)
        ma = np.convolve(prices_array, np.ones(self.window)/self.window, mode='valid')
        
        # Прогноз - последнее значение MA
        forecast_price = ma[-1]
        
        # Генерируем прогноз с экспоненциальным сглаживанием
        forecast_dates = [last_date + timedelta(days=i+1) for i in range(days_ahead)]
        forecast_prices = []
        
        current_price = prices[-1]
        alpha = 0.3  # Коэффициент сглаживания
        
        for _ in range(days_ahead):
            # Экспоненциальное сглаживание к MA
            current_price = current_price * (1 - alpha) + forecast_price * alpha
            forecast_prices.append(current_price)
        
        inference_time = time.time() - start_time
        
        return ForecastResult(
            predictions=forecast_prices,
            dates=forecast_dates,
            trend=self._detect_trend(prices),
            model_name=self.name,
            inference_time=inference_time
        )


class LinearExtrapolationModel(BaseModel):
    """
    Алгоритм 3: Линейная экстраполяция
    Продлевает текущий тренд в будущее
    """
    
    def __init__(self):
        super().__init__("Linear Extrapolation")
    
    def predict(self, prices: List[float], dates: List[datetime], days_ahead: int = 7) -> ForecastResult:
        start_time = time.time()
        
        if len(prices) < 2:
            raise ValueError("Недостаточно данных. Нужно минимум 2 точки")
        
        last_date = dates[-1]
        
        # Линейная регрессия
        x = np.arange(len(prices))
        coeffs = np.polyfit(x, prices, 1)
        slope, intercept = coeffs
        
        # Прогноз
        forecast_dates = [last_date + timedelta(days=i+1) for i in range(days_ahead)]
        forecast_x = np.arange(len(prices), len(prices) + days_ahead)
        forecast_prices = slope * forecast_x + intercept
        
        # Ограничиваем от нереалистичных значений
        last_price = prices[-1]
        forecast_prices = np.clip(forecast_prices, last_price * 0.5, last_price * 1.5)
        
        inference_time = time.time() - start_time
        
        return ForecastResult(
            predictions=forecast_prices.tolist(),
            dates=forecast_dates,
            trend=self._detect_trend(prices),
            model_name=self.name,
            inference_time=inference_time
        )


class ArimaModel(BaseModel):
    """
    Алгоритм 4: ARIMA модель
    Авторегрессионная интегрированная модель скользящего среднего
    """

    def __init__(self, order=(1, 1, 1)):
        super().__init__(f"ARIMA{order}")
        self.order = order

    def predict(self, prices: List[float], dates: List[datetime], days_ahead: int = 7) -> ForecastResult:
        start_time = time.time()

        if len(prices) < 10:
            raise ValueError("Недостаточно данных. Нужно минимум 10 точек для ARIMA")

        try:
            # Создаем временной ряд
            ts = pd.Series(prices, index=dates)

            # Обучаем ARIMA модель
            model = ARIMA(ts, order=self.order)
            model_fit = model.fit()

            # Прогноз
            forecast = model_fit.forecast(steps=days_ahead)

            forecast_dates = [dates[-1] + timedelta(days=i+1) for i in range(days_ahead)]
            forecast_prices = forecast.values.tolist()

            inference_time = time.time() - start_time

            return ForecastResult(
                predictions=forecast_prices,
                dates=forecast_dates,
                trend=self._detect_trend(prices),
                model_name=self.name,
                inference_time=inference_time
            )

        except Exception as e:
            # Fallback to linear extrapolation if ARIMA fails
            print(f"ARIMA failed: {e}, using linear extrapolation")
            linear_model = LinearExtrapolationModel()
            return linear_model.predict(prices, dates, days_ahead)


class ExponentialSmoothingModel(BaseModel):
    """
    Алгоритм 5: Экспоненциальное сглаживание
    Метод Хольта-Винтерса для трендовых данных
    """

    def __init__(self):
        super().__init__("Exponential Smoothing")

    def predict(self, prices: List[float], dates: List[datetime], days_ahead: int = 7) -> ForecastResult:
        start_time = time.time()

        if len(prices) < 10:
            raise ValueError("Недостаточно данных. Нужно минимум 10 точек")

        try:
            # Создаем временной ряд
            ts = pd.Series(prices, index=dates)

            # Экспоненциальное сглаживание
            model = ExponentialSmoothing(ts, trend='add', seasonal=None)
            model_fit = model.fit()

            # Прогноз
            forecast = model_fit.forecast(days_ahead)

            forecast_dates = [dates[-1] + timedelta(days=i+1) for i in range(days_ahead)]
            forecast_prices = forecast.values.tolist()

            inference_time = time.time() - start_time

            return ForecastResult(
                predictions=forecast_prices,
                dates=forecast_dates,
                trend=self._detect_trend(prices),
                model_name=self.name,
                inference_time=inference_time
            )

        except Exception as e:
            # Fallback to linear extrapolation
            print(f"Exponential Smoothing failed: {e}, using linear extrapolation")
            linear_model = LinearExtrapolationModel()
            return linear_model.predict(prices, dates, days_ahead)


# ============================================================================
# ФАБРИКА МОДЕЛЕЙ
# ============================================================================

def get_model(model_type: str = "linear") -> BaseModel:
    """Получить модель по типу"""
    models = {
        "naive": NaiveModel(),
        "ma": MovingAverageModel(window=7),
        "linear": LinearExtrapolationModel(),
        "arima": ArimaModel(),
        "exponential": ExponentialSmoothingModel()
    }
    return models.get(model_type, LinearExtrapolationModel())


if __name__ == "__main__":
    # Тест
    dates = pd.date_range(start='2024-11-01', end='2024-11-30', freq='D').tolist()
    prices = [50000 + i * 100 + np.random.normal(0, 500) for i in range(len(dates))]
    
    print("🧪 Тестирование моделей\n")
    
    for model_type in ["naive", "ma", "linear", "arima", "exponential"]:
        model = get_model(model_type)
        result = model.predict(prices, dates, days_ahead=7)
        
        print(f"Model: {model.name}")
        print(f"  Inference time: {result.inference_time:.4f}s")
        print(f"  Trend: {result.trend}")
        print(f"  First prediction: {result.predictions[0]:.2f}")
        print()
