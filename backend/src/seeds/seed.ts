import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Category from '../models/Category';
import Dish from '../models/Dish';
import Promotion from '../models/Promotion';

const seedDatabase = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Dish.deleteMany({}),
    Promotion.deleteMany({}),
  ]);

  console.log('Cleared existing data');

  // Create admin user
  const admin = await User.create({
    fullName: 'Admin User',
    email: 'admin@momoresto.com',
    phone: '+1234567890',
    passwordHash: 'admin123',
    role: 'admin',
    isVerified: true,
  });
  console.log('Admin user created:', admin.email);

  // Create test customer
  await User.create({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1987654321',
    passwordHash: 'password123',
    role: 'customer',
    isVerified: true,
  });
  console.log('Test customer created');

  // Create categories
  const categories = await Category.insertMany([
    { name: 'Appetizers', slug: 'appetizers', description: 'Start your meal right', image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400', displayOrder: 1 },
    { name: 'Main Course', slug: 'main-course', description: 'Hearty and satisfying', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', displayOrder: 2 },
    { name: 'Pasta & Risotto', slug: 'pasta-risotto', description: 'Italian classics', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', displayOrder: 3 },
    { name: 'Seafood', slug: 'seafood', description: 'Fresh from the ocean', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', displayOrder: 4 },
    { name: 'Desserts', slug: 'desserts', description: 'Sweet endings', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', displayOrder: 5 },
    { name: 'Beverages', slug: 'beverages', description: 'Refreshing drinks', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', displayOrder: 6 },
  ]);
  console.log(`${categories.length} categories created`);

  // Create dishes
  const dishes = await Dish.insertMany([
    // Appetizers
    {
      name: 'Truffle Bruschetta',
      description: 'Toasted sourdough topped with truffle-infused mushroom duxelles, micro greens, and aged parmesan shavings',
      price: 14.99,
      images: ['https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600'],
      category: categories[0]._id,
      tags: ['new', 'vegetarian'],
      addOns: [{ name: 'Extra Truffle Oil', price: 3.00, image: '' }, { name: 'Burrata', price: 5.00, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -3 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 5 }],
      preparationTime: 12,
      rating: { average: 4.7, count: 42 },
      isFeatured: true,
      calories: 280,
      ingredients: ['Sourdough', 'Truffle oil', 'Mushrooms', 'Parmesan', 'Micro greens'],
    },
    {
      name: 'Spicy Tuna Tartare',
      description: 'Fresh ahi tuna with sriracha aioli, avocado mousse, sesame tuile, and tobiko caviar',
      price: 18.99,
      images: ['https://images.unsplash.com/photo-1534604738535-62a37dbe603e?w=600'],
      category: categories[0]._id,
      tags: ['spicy', 'bestseller'],
      addOns: [{ name: 'Extra Avocado', price: 2.50, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -4 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 6 }],
      preparationTime: 10,
      rating: { average: 4.9, count: 87 },
      isFeatured: true,
      calories: 220,
      ingredients: ['Ahi tuna', 'Sriracha', 'Avocado', 'Sesame', 'Tobiko'],
    },
    {
      name: 'Crispy Calamari',
      description: 'Lightly battered squid rings served with marinara and lemon garlic aioli',
      price: 13.99,
      images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600'],
      category: categories[0]._id,
      tags: ['bestseller'],
      addOns: [{ name: 'Extra Dipping Sauce', price: 1.50, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -2 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 4 }],
      preparationTime: 15,
      rating: { average: 4.5, count: 63 },
      calories: 350,
      ingredients: ['Squid', 'Flour', 'Marinara', 'Lemon', 'Garlic'],
    },
    // Main Course
    {
      name: 'Wagyu Beef Burger',
      description: 'Premium wagyu patty with aged cheddar, caramelized onions, truffle mayo on a brioche bun',
      price: 24.99,
      images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600'],
      category: categories[1]._id,
      tags: ['bestseller'],
      addOns: [{ name: 'Extra Patty', price: 8.00, image: '' }, { name: 'Bacon', price: 3.00, image: '' }, { name: 'Fried Egg', price: 2.00, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -5 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 7 }],
      preparationTime: 20,
      rating: { average: 4.8, count: 156 },
      isFeatured: true,
      calories: 720,
      ingredients: ['Wagyu beef', 'Cheddar', 'Onions', 'Truffle mayo', 'Brioche bun'],
    },
    {
      name: 'Herb-Crusted Lamb Rack',
      description: 'New Zealand lamb rack with rosemary jus, roasted root vegetables, and potato gratin',
      price: 38.99,
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600'],
      category: categories[1]._id,
      tags: ['new'],
      addOns: [{ name: 'Extra Jus', price: 2.00, image: '' }],
      sizes: [{ label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 12 }],
      preparationTime: 35,
      rating: { average: 4.9, count: 34 },
      isFeatured: true,
      calories: 580,
      ingredients: ['Lamb', 'Rosemary', 'Root vegetables', 'Potato', 'Cream'],
    },
    {
      name: 'Grilled Chicken Supreme',
      description: 'Free-range chicken breast with lemon butter sauce, asparagus, and wild mushroom risotto',
      price: 22.99,
      images: ['https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600'],
      category: categories[1]._id,
      tags: ['healthy', 'gluten-free'],
      addOns: [{ name: 'Extra Risotto', price: 4.00, image: '' }],
      sizes: [{ label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 5 }],
      preparationTime: 25,
      rating: { average: 4.6, count: 89 },
      calories: 450,
      ingredients: ['Chicken', 'Lemon', 'Butter', 'Asparagus', 'Mushrooms', 'Arborio rice'],
    },
    // Pasta & Risotto
    {
      name: 'Black Truffle Fettuccine',
      description: 'Handmade fettuccine with black truffle cream sauce, pecorino romano, and fresh herbs',
      price: 26.99,
      images: ['https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600'],
      category: categories[2]._id,
      tags: ['vegetarian', 'bestseller'],
      addOns: [{ name: 'Extra Truffle Shavings', price: 8.00, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -5 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 6 }],
      preparationTime: 20,
      rating: { average: 4.8, count: 112 },
      isFeatured: true,
      calories: 520,
      ingredients: ['Fettuccine', 'Black truffle', 'Cream', 'Pecorino', 'Herbs'],
    },
    {
      name: 'Lobster Risotto',
      description: 'Creamy arborio rice with Maine lobster tail, saffron broth, and chive oil',
      price: 34.99,
      images: ['https://images.unsplash.com/photo-1633964913295-ceb43826e7c7?w=600'],
      category: categories[2]._id,
      tags: ['new'],
      addOns: [{ name: 'Extra Lobster', price: 15.00, image: '' }],
      sizes: [{ label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 10 }],
      preparationTime: 30,
      rating: { average: 4.9, count: 28 },
      isFeatured: true,
      calories: 480,
      ingredients: ['Arborio rice', 'Lobster', 'Saffron', 'Butter', 'Chives'],
    },
    {
      name: 'Spaghetti Carbonara',
      description: 'Classic Roman-style with guanciale, egg yolk, pecorino, and cracked black pepper',
      price: 19.99,
      images: ['https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600'],
      category: categories[2]._id,
      tags: ['bestseller'],
      addOns: [{ name: 'Extra Guanciale', price: 3.00, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -4 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 5 }],
      preparationTime: 18,
      rating: { average: 4.7, count: 95 },
      calories: 560,
      ingredients: ['Spaghetti', 'Guanciale', 'Egg yolk', 'Pecorino', 'Black pepper'],
    },
    // Seafood
    {
      name: 'Pan-Seared Salmon',
      description: 'Atlantic salmon with miso glaze, bok choy, jasmine rice, and ginger-scallion oil',
      price: 28.99,
      images: ['https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600'],
      category: categories[3]._id,
      tags: ['healthy', 'gluten-free'],
      addOns: [{ name: 'Extra Rice', price: 3.00, image: '' }],
      sizes: [{ label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 8 }],
      preparationTime: 22,
      rating: { average: 4.7, count: 71 },
      isFeatured: true,
      calories: 420,
      ingredients: ['Salmon', 'Miso', 'Bok choy', 'Jasmine rice', 'Ginger', 'Scallion'],
    },
    {
      name: 'Grilled Mediterranean Sea Bass',
      description: 'Whole branzino with cherry tomatoes, olives, capers, and herb oil',
      price: 32.99,
      images: ['https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600'],
      category: categories[3]._id,
      tags: ['healthy', 'gluten-free'],
      addOns: [{ name: 'Side Salad', price: 4.00, image: '' }],
      sizes: [{ label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 10 }],
      preparationTime: 28,
      rating: { average: 4.6, count: 43 },
      calories: 380,
      ingredients: ['Branzino', 'Cherry tomatoes', 'Olives', 'Capers', 'Herbs'],
    },
    // Desserts
    {
      name: 'Molten Chocolate Lava Cake',
      description: 'Dark Valrhona chocolate cake with liquid center, vanilla bean ice cream, and gold leaf',
      price: 15.99,
      images: ['https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600'],
      category: categories[4]._id,
      tags: ['bestseller', 'vegetarian'],
      addOns: [{ name: 'Extra Ice Cream Scoop', price: 3.00, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -3 }, { label: 'Medium', priceModifier: 0 }],
      preparationTime: 15,
      rating: { average: 4.9, count: 134 },
      isFeatured: true,
      calories: 480,
      ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Flour', 'Vanilla ice cream'],
    },
    {
      name: 'Tiramisu',
      description: 'Classic Italian layered dessert with espresso-soaked ladyfingers and mascarpone cream',
      price: 12.99,
      images: ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600'],
      category: categories[4]._id,
      tags: ['vegetarian'],
      addOns: [{ name: 'Extra Espresso Shot', price: 1.50, image: '' }],
      sizes: [{ label: 'Small', priceModifier: -2 }, { label: 'Medium', priceModifier: 0 }],
      preparationTime: 5,
      rating: { average: 4.8, count: 78 },
      calories: 320,
      ingredients: ['Ladyfingers', 'Espresso', 'Mascarpone', 'Cocoa', 'Eggs'],
    },
    {
      name: 'Crème Brûlée',
      description: 'Madagascar vanilla custard with caramelized sugar crust and fresh berries',
      price: 11.99,
      images: ['https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600'],
      category: categories[4]._id,
      tags: ['vegetarian', 'gluten-free'],
      sizes: [{ label: 'Small', priceModifier: -2 }, { label: 'Medium', priceModifier: 0 }],
      preparationTime: 8,
      rating: { average: 4.7, count: 56 },
      calories: 290,
      ingredients: ['Heavy cream', 'Vanilla', 'Egg yolks', 'Sugar', 'Berries'],
    },
    // Beverages
    {
      name: 'Signature Espresso Martini',
      description: 'Vodka, fresh espresso, Kahlúa, and vanilla syrup with coffee bean garnish',
      price: 16.99,
      images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600'],
      category: categories[5]._id,
      tags: ['bestseller'],
      sizes: [{ label: 'Small', priceModifier: -3 }, { label: 'Medium', priceModifier: 0 }],
      preparationTime: 5,
      rating: { average: 4.8, count: 92 },
      calories: 180,
      ingredients: ['Vodka', 'Espresso', 'Kahlúa', 'Vanilla syrup'],
    },
    {
      name: 'Fresh Mango Smoothie',
      description: 'Blended mango, passion fruit, coconut cream, and a hint of lime',
      price: 8.99,
      images: ['https://images.unsplash.com/photo-1546173159-315724a31696?w=600'],
      category: categories[5]._id,
      tags: ['vegan', 'healthy'],
      sizes: [{ label: 'Small', priceModifier: -2 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 3 }],
      preparationTime: 5,
      rating: { average: 4.6, count: 45 },
      calories: 160,
      ingredients: ['Mango', 'Passion fruit', 'Coconut cream', 'Lime'],
    },
    {
      name: 'Sparkling Elderflower Lemonade',
      description: 'House-made elderflower syrup with fresh lemon and sparkling water',
      price: 6.99,
      images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600'],
      category: categories[5]._id,
      tags: ['vegan', 'healthy'],
      sizes: [{ label: 'Small', priceModifier: -1.5 }, { label: 'Medium', priceModifier: 0 }, { label: 'Large', priceModifier: 2 }],
      preparationTime: 3,
      rating: { average: 4.5, count: 38 },
      calories: 90,
      ingredients: ['Elderflower syrup', 'Lemon', 'Sparkling water', 'Mint'],
    },
  ]);
  console.log(`${dishes.length} dishes created`);

  // Create promotions
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Promotion.insertMany([
    {
      title: 'Grand Opening Special',
      description: 'Enjoy 20% off on all appetizers this month!',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      discountType: 'percentage',
      discountValue: 20,
      applicableDishes: dishes.filter(d => d.category.toString() === categories[0]._id.toString()).map(d => d._id),
      validFrom: now,
      validUntil: nextMonth,
      isActive: true,
    },
    {
      title: 'Dessert Happy Hour',
      description: '$5 off any dessert with a main course order',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
      discountType: 'fixed',
      discountValue: 5,
      applicableDishes: dishes.filter(d => d.category.toString() === categories[4]._id.toString()).map(d => d._id),
      validFrom: now,
      validUntil: nextMonth,
      isActive: true,
    },
  ]);
  console.log('Promotions created');

  console.log('\nSeed completed successfully!');
  console.log('Admin login: admin@momoresto.com / admin123');
  console.log('Customer login: john@example.com / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seedDatabase().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
