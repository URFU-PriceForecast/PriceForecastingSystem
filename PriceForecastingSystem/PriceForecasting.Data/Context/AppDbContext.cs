// Файл: AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Models;
namespace PriceForecasting.Data.Context; 

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> users => Set<User>();
    public DbSet<Category> categories => Set<Category>();
    public DbSet<Product> products => Set<Product>();
    public DbSet<PriceHistory> price_history => Set<PriceHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Явно указываем имена таблиц и столбцов — чтобы соответствовать SQL-схеме
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<User>().Property(u => u.id).HasColumnName("Id");
        modelBuilder.Entity<User>().Property(u => u.username).HasColumnName("Username");
        modelBuilder.Entity<User>().Property(u => u.password).HasColumnName("PasswordHash");
        modelBuilder.Entity<User>().Property(u => u.email).HasColumnName("Email");

        modelBuilder.Entity<Category>().ToTable("Categories");
        modelBuilder.Entity<Category>().Property(c => c.id).HasColumnName("Id");
        modelBuilder.Entity<Category>().Property(c => c.name).HasColumnName("Name");
        modelBuilder.Entity<Category>().Property(c => c.parent_id).HasColumnName("ParentId");

        modelBuilder.Entity<Product>().ToTable("Products");
        modelBuilder.Entity<Product>().Property(p => p.id).HasColumnName("Id");
        modelBuilder.Entity<Product>().Property(p => p.article).HasColumnName("Article");
        modelBuilder.Entity<Product>().Property(p => p.name).HasColumnName("Name");
        modelBuilder.Entity<Product>().Property(p => p.description).HasColumnName("Description");
        modelBuilder.Entity<Product>().Property(p => p.category_id).HasColumnName("CategoryId");
        modelBuilder.Entity<Product>().Property(p => p.brand).HasColumnName("Brand");
        modelBuilder.Entity<Product>().Property(p => p.image_url).HasColumnName("ImageUrl");

        modelBuilder.Entity<PriceHistory>().ToTable("PriceHistory");
        modelBuilder.Entity<PriceHistory>().Property(ph => ph.id).HasColumnName("Id");
        modelBuilder.Entity<PriceHistory>().Property(ph => ph.product_id).HasColumnName("ProductId");
        modelBuilder.Entity<PriceHistory>().Property(ph => ph.price).HasColumnName("Price").HasColumnType("decimal(18,2)");
        modelBuilder.Entity<PriceHistory>().Property(ph => ph.created_at).HasColumnName("CreatedAt");
    }
}