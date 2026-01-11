using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;

public static class SeedData
{
    public static void Initialize(AppDbContext context)
    {
        // Добавляем категории
        if (!context.categories.Any())
        {
            var categories = new[]
            {
                new Category { name = "Смартфоны", parent_id = null },
                new Category { name = "Ноутбуки", parent_id = null },
                new Category { name = "Наушники", parent_id = null },
                new Category { name = "Бытовая техника", parent_id = null }
            };

            context.categories.AddRange(categories);
            context.SaveChanges();
        }

        // Добавляем товары
        if (!context.products.Any())
        {
            var smartphones = context.categories.First(c => c.name == "Смартфоны");
            var laptops = context.categories.First(c => c.name == "Ноутбуки");
            var headphones = context.categories.First(c => c.name == "Наушники");
            var appliances = context.categories.First(c => c.name == "Бытовая техника");

            var products = new[]
            {
                new Product { article = "482159736", name = "Смартфон iPhone 15 128GB", description = "Флагманский смартфон Apple", category_id = smartphones.id, brand = "Apple", image_url = "/images/iphone15.jpg" },
                new Product { article = "5938472610", name = "Смартфон iPhone 15 256GB", description = "Флагманский смартфон Apple с большим хранилищем", category_id = smartphones.id, brand = "Apple", image_url = "/images/iphone15-256.jpg" },
                new Product { article = "620184735", name = "Смартфон Samsung Galaxy S24 128GB", description = "Флагманский смартфон Samsung", category_id = smartphones.id, brand = "Samsung", image_url = "/images/galaxy-s24.jpg" },
                new Product { article = "7493825160", name = "Смартфон Samsung Galaxy S23 256GB", description = "Предыдущее поколение флагмана Samsung", category_id = smartphones.id, brand = "Samsung", image_url = "/images/galaxy-s23.jpg" },
                new Product { article = "815937402", name = "Смартфон Xiaomi 13 Lite 128GB", description = "Бюджетный флагман Xiaomi", category_id = smartphones.id, brand = "Xiaomi", image_url = "/images/xiaomi13-lite.jpg" },
                new Product { article = "9264738151", name = "Смартфон Xiaomi Redmi Note 12 128GB", description = "Доступный смартфон Xiaomi", category_id = smartphones.id, brand = "Xiaomi", image_url = "/images/redmi-note12.jpg" },
                new Product { article = "1038574926", name = "Смартфон OPPO Reno 10 256GB", description = "Стильный смартфон OPPO", category_id = smartphones.id, brand = "OPPO", image_url = "/images/oppo-reno10.jpg" },

                new Product { article = "284619537", name = "Ноутбук MacBook Pro 14\" M3 512GB", description = "Профессиональный ноутбук Apple", category_id = laptops.id, brand = "Apple", image_url = "/images/macbook-pro-14.jpg" },
                new Product { article = "3957281640", name = "Ноутбук MacBook Air 13\" M2 256GB", description = "Легкий ноутбук Apple", category_id = laptops.id, brand = "Apple", image_url = "/images/macbook-air-13.jpg" },
                new Product { article = "462839175", name = "Ноутбук ASUS VivoBook 15 i5 512GB", description = "Универсальный ноутбук ASUS", category_id = laptops.id, brand = "ASUS", image_url = "/images/vivobook-15.jpg" },

                new Product { article = "9374851260", name = "Наушники AirPods Pro 2", description = "Беспроводные наушники Apple", category_id = headphones.id, brand = "Apple", image_url = "/images/airpods-pro2.jpg" },
                new Product { article = "148259637", name = "Наушники AirPods 3", description = "Беспроводные наушники Apple", category_id = headphones.id, brand = "Apple", image_url = "/images/airpods-3.jpg" },
                new Product { article = "2593671480", name = "Наушники Sony WH-1000XM5", description = "Шумоподавляющие наушники Sony", category_id = headphones.id, brand = "Sony", image_url = "/images/wh-1000xm5.jpg" }
            };

            context.products.AddRange(products);
            context.SaveChanges();
        }

        // Добавляем историю цен (если нет)
        if (!context.price_history.Any())
        {
            var products = context.products.ToList();
            var random = new Random();
            var startDate = DateTime.Now.AddDays(-90);

            foreach (var product in products)
            {
                var basePrice = 30000 + random.Next(20000, 80000); // Базовая цена от 30к до 110к

                for (int i = 0; i < 90; i++)
                {
                    var date = startDate.AddDays(i);
                    var priceVariation = (decimal)(random.NextDouble() * 0.2 - 0.1); // +/- 10%
                    var price = basePrice * (1 + priceVariation);

                    context.price_history.Add(new PriceHistory
                    {
                        product_id = product.id,
                        price = Math.Round(price, 2),
                        created_at = date
                    });
                }
            }

            context.SaveChanges();
        }
    }
}
