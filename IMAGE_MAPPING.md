# Menu Items to Image Mapping

This document shows the mapping between menu items and images in the `public/menu-images` folder.

## ✅ Matched Items

### Finger Food (Per Item)
- **Beef Mini Burger** → `beef-burger.png`
- **Chicken Mini Burger** → `mini-chicken-burger.png`
- **Crumbed Fish Mini Burger** → (no direct match, but `mini-sliders.png` might work)
- **Halloumi Turkish Bread** → `turkish-halloumi.jpg` or `mini-halloumi.png`
- **Salmon Mini Bagel** → `salmon bagel.png`
- **Mini Croissant** → `mini-croissant.png`
- **Mini Baguette** → `mini-bagguette.png`
- **Chicken Mini Wrap** → `chicken-fajitas-wraps.png` (or `mini-haloumi-wraps.png` for halloumi)
- **Falafel Mini Wrap** → `falafel-wrap.jpg`
- **Halloumi Mini Wrap** → `mini-haloumi-wraps.png` or `mini-halloumi.png`
- **Chicken Fajita Wrap** → `chicken-fajitas-wraps.png`

### Finger Food (Per Dozen)
- **Kibbeh (Per Dozen)** → `kibbeh-dozen.png` or `Kibbeh-dozen-22.png`
- **Meat Sambousik (Per Dozen)** → `sambousik.png`
- **Cheese Sambousik (Per Dozen)** → `Cheese-sambousek.png`
- **Pizza Supreme (Per Dozen)** → `pizza-supreme.png`
- **Vegetarian Pizza (Per Dozen)** → `pizza-veggie.png`
- **Cheese Pizza (Per Dozen)** → `mini-cheese.png`
- **Zaatar Pizza (Per Dozen)** → `mini zaatar.png`
- **Spinach Fatayer (Per Dozen)** → `spinash_fatayer.png`
- **Vegetable Spring Rolls (Per Dozen)** → `vegetable spring rolls.png`
- **Falafel Platter (Per Dozen)** → `falafel.png`

### Salads
- **Tabouli** → `tabouli.png` or `tabouli-salads.jpeg`
- **Fattoush** → `fattouch.png`
- **Greek Salad** → `greek-salad.png` ✅ NEW
- **Seafood Pasta Salad** → `crab_pasta_salad.png`
- **Garden Salad** → `mini salads.jpeg`
- **Mixed Bean Salad** → (no direct match)
- **Chicken Caesar Salad** → `chicken-pesto-salad.png` (might work)
- **Rocket Salad** → (no direct match)

### Dips
- **Hummus** → `hummus.png`
- **Garlic Dip (Toum)** → `garlic.png`
- **Eggplant Dip (Baba Ghanoush)** → `baba ghanouj.jpeg`
- **Tahini Dip** → `tahini.png`

### Pasta & Noodle Platters
- **Creamy Chicken Pasta** → `creamy chicken pasta.png`
- **Bolognese Pasta** → `pasta bolognese.png`
- **Lasagna** → `lasagna-tray.jpeg`
- **Pesto Chicken Penne** → `chicken-pesto-salad.png` (might work, but it's a salad)
- **Penne Arrabbiata** → `penne-arabiatta.png`
- **Chicken & Vegetable Noodles** → `chicken noodles.png`
- **Beef & Vegetable Noodles** → `noodles with meat.jpeg` ✅ NEW
- **Prawn & Vegetable Noodles** → `noodles with prawns.png`

### BBQ & Grills
- **Lamb Skewers** → `lamb skewer.png` ✅ NEW
- **Chicken Skewers (Shish Tawook)** → `chicken-skewer.png` ✅ NEW
- **Kafta Skewers** → `kafta-skewers.png` ✅ NEW
- **Chicken Wings (Per Dozen)** → `chicken-wings-grilled.png` ✅ NEW
- **BBQ Mixed Grill Platter** → `finger-food.png`

### Mediterranean Main Platters
- **Kibbeh Naye** → `kibbeh_naye-.png` or `kibbeh-nayyeh.png`
- **Oven Baked Kibbeh** → `kibbeh-tray.png`
- **Fish with Tahini (Samke Harra)** → (no direct match)
- **Riz a Djej (Chicken with Rice)** → `rice with chicken -riz a djej.png` ✅ NEW
- **Moghrabieh** → `moghrabiye.png`
- **Mansaf Lamb with Rice** → `rice with meat.png` ✅ NEW
- **Vine Leaves with Lamb Chops** → `vine leaves with meat.jpeg`
- **Kafta with Potatoes** → `kafta w batata.jpeg` ✅ NEW
- **Stuffed Lebanese Zucchini (Kousa)** → (no direct match)
- **Chicken Stroganoff** → (no direct match)

### Paella
- **Paella** → `paella.png` ✅

### Vegetarian Lebanese Platters
- **Vine Leaves (Vegetarian)** → `vg-vine_leaves.png`
- **Fried Rice** → `rice.jpeg`
- **Lentils with Rice (Mujadara)** → `mjadra.png`
- **Baked Potatoes with Rice (Batata Harra)** → `batata_harra1.png`
- **Baked Vegetables** → `roasted-vegetables.png`
- **Fried Cauliflower with Tahini (Arnabit)** → `arnabeet.png`

### Desserts
- **Granola (Muesli, Yogurt & Fruit)** → (no direct match)
- **Fruit Salad** → (no direct match)
- **Fresh Garden Salad Cup** → `mini salads.jpeg` (might work)
- **Cheesecake** → (no direct match)
- **Strawberry Tart** → `tarte-strawberry.png` ✅ NEW

## 📝 Notes
- Some items have multiple potential matches (e.g., kibbeh has several images)
- Some items don't have direct matches and will need new images or use generic placeholders
- Images with similar names but different formats (e.g., `.png` vs `.jpeg`) are noted
- Some images might be used for multiple items (e.g., `rice.jpeg` for multiple rice dishes)

## 🔧 Next Steps
1. Review the mappings above
2. Update the seed file to use local image paths (`/menu-images/filename.png`)
3. For items without matches, either:
   - Add new images to the folder
   - Use the closest matching image
   - Keep using placeholder/Unsplash images
