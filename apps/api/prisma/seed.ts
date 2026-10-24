import { PrismaClient, Role, SellerStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Retire l'ancien admin
  await prisma.user.deleteMany({ where: { phone: '+2250700000001' } });

  const admin = await prisma.user.upsert({
    where: { phone: '+22676950089' },
    update: { role: Role.ADMIN },
    create: { phone: '+22676950089', role: Role.ADMIN, country: 'BF' },
  });

  const sellerUser = await prisma.user.upsert({
    where: { phone: '+2250700000002' },
    update: {},
    create: { phone: '+2250700000002', role: Role.SELLER, country: 'CI' },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      shopName: 'Atelier Kita',
      city: 'Abidjan',
      status: SellerStatus.APPROVED,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { phone: '+2250700000003' },
    update: {},
    create: { phone: '+2250700000003', role: Role.BUYER, country: 'CI' },
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-buyer-1' },
    update: {},
    create: {
      id: 'seed-address-buyer-1',
      buyerId: buyer.id,
      label: 'Domicile',
      fullAddress: 'Cocody Angré, Rue des Jardins, Villa 12',
      city: 'Abidjan',
      isDefault: true,
    },
  });

  await prisma.coupon.upsert({
    where: { id: 'seed-coupon-buyer-1' },
    update: {},
    create: {
      id: 'seed-coupon-buyer-1',
      buyerId: buyer.id,
      label: 'Bienvenue sur Baobab',
      discountAmount: 1000,
    },
  });

  await prisma.follow.upsert({
    where: { buyerId_sellerId: { buyerId: buyer.id, sellerId: seller.id } },
    update: {},
    create: { buyerId: buyer.id, sellerId: seller.id },
  });

  const categories = await Promise.all(
    [
      { name: 'Mode & Accessoires', slug: 'mode-accessoires' },
      { name: 'Maison & Cuisine', slug: 'maison-cuisine' },
      { name: 'Électronique', slug: 'electronique' },
      { name: 'Beauté & Bien-être', slug: 'beaute-bien-etre' },
    ].map((c) =>
      prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c }),
    ),
  );

  const products = [
    // Mode & Accessoires
    { name: 'Boubou brodé homme', description: 'Boubou traditionnel en bazin riche, broderie artisanale.', price: 25000, stock: 12, categoryId: categories[0].id, sellerId: seller.id, images: [] },
    { name: 'Sac à main tissé raphia', description: "Sac artisanal tissé main, fabriqué par des coopératives locales.", price: 9000, compareAtPrice: 12000, stock: 20, categoryId: categories[0].id, sellerId: seller.id, images: [] },
    { name: 'Sneakers sport homme', description: 'Chaussures de sport respirantes, semelle amortissante.', price: 18000, compareAtPrice: 22000, stock: 25, categoryId: categories[0].id, sellerId: seller.id, images: [] },
    { name: 'Montre connectée Bluetooth', description: 'Montre intelligente avec suivi santé et notifications.', price: 22000, compareAtPrice: 28000, stock: 18, categoryId: categories[0].id, sellerId: null, images: [] },
    { name: 'Lunettes de soleil UV400', description: 'Lunettes polarisées protection UV400, monture légère.', price: 6500, compareAtPrice: 8500, stock: 40, categoryId: categories[0].id, sellerId: null, images: [] },
    // Maison & Cuisine
    { name: 'Service à café en calebasse', description: 'Ensemble de service décoratif en calebasse peinte.', price: 8000, stock: 15, categoryId: categories[1].id, sellerId: null, images: [] },
    { name: 'Bouilloire électrique 1.7L', description: 'Bouilloire inox rapide avec arrêt automatique.', price: 9500, compareAtPrice: 12000, stock: 30, categoryId: categories[1].id, sellerId: null, images: [] },
    { name: 'Mixeur blender 500W', description: 'Blender multifonction pour smoothies et soupes.', price: 16000, compareAtPrice: 20000, stock: 20, categoryId: categories[1].id, sellerId: seller.id, images: [] },
    { name: 'Batterie de cuisine 12 pièces', description: 'Set de casseroles et poêles antiadhésives.', price: 24000, compareAtPrice: 30000, stock: 10, categoryId: categories[1].id, sellerId: seller.id, images: [] },
    { name: 'Lampe solaire LED', description: 'Lampe solaire rechargeable avec panneau intégré.', price: 7000, compareAtPrice: 9000, stock: 35, categoryId: categories[1].id, sellerId: null, images: [] },
    // Électronique
    { name: 'Enceinte Bluetooth portable', description: '10h autonomie, résistante à la poussière.', price: 14500, compareAtPrice: 18000, stock: 30, categoryId: categories[2].id, sellerId: null, images: [] },
    { name: 'Smartphone Android 6.5"', description: 'Smartphone 4G, 64Go, double SIM, caméra 48MP.', price: 85000, compareAtPrice: 99000, stock: 15, categoryId: categories[2].id, sellerId: null, images: [] },
    { name: 'Écouteurs sans fil TWS', description: 'Écouteurs Bluetooth avec boîtier de charge.', price: 8000, compareAtPrice: 11000, stock: 50, categoryId: categories[2].id, sellerId: null, images: [] },
    { name: 'Power bank 20000mAh', description: 'Batterie externe haute capacité charge rapide.', price: 12000, compareAtPrice: 15000, stock: 40, categoryId: categories[2].id, sellerId: null, images: [] },
    { name: 'Tablette 10 pouces', description: 'Tablette Android 10", 64Go, WiFi.', price: 65000, compareAtPrice: 79000, stock: 12, categoryId: categories[2].id, sellerId: null, images: [] },
    // Beauté & Bien-Être
    { name: 'Beurre de karité pur 500g', description: 'Beurre de karité brut, non raffiné, origine Burkina Faso.', price: 3500, stock: 50, categoryId: categories[3].id, sellerId: seller.id, images: [] },
    { name: 'Parfum floral 50ml', description: 'Eau de parfum longue tenue, notes florales.', price: 15000, compareAtPrice: 19000, stock: 25, categoryId: categories[3].id, sellerId: seller.id, images: [] },
    { name: 'Crème hydratante visage', description: 'Crème hydratante pour peaux sensibles.', price: 4500, compareAtPrice: 6000, stock: 40, categoryId: categories[3].id, sellerId: seller.id, images: [] },
    { name: 'Sèche-cheveux professionnel', description: 'Sèche-cheveux 2200W avec diffuseur.', price: 13000, compareAtPrice: 16500, stock: 20, categoryId: categories[3].id, sellerId: null, images: [] },
    { name: 'Huile de coco vierge 250ml', description: 'Huile de coco pure pour peau et cheveux.', price: 3000, compareAtPrice: 4000, stock: 60, categoryId: categories[3].id, sellerId: seller.id, images: [] },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      // Ne touche pas au stock : il reflète les vraies commandes passées en test.
      await prisma.product.update({
        where: { id: existing.id },
        data: { price: p.price, compareAtPrice: p.compareAtPrice ?? null, description: p.description },
      });
    } else {
      await prisma.product.create({ data: p });
    }
  }

  console.log('Seed complete. Admin phone:', admin.phone, '/ Seller phone:', sellerUser.phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
