# Price List (from `prisma/seed.ts`)

All prices are **AUD**.

## Notes
- **Finger Food – per item**: minimum quantity **12 pieces** (where `minimumQuantity` is set)
- **Finger Food – per dozen / paella**: minimum quantity **12** where noted
- **Chicken Wings (per dozen)**: minimum quantity **1** (1 quantity = 1 dozen)
- **Dips (Hummus, Eggplant, Garlic, Tahini)**: one menu row each; four serving options (stored in seed as sized prices)
  - Medium dip **$13**
  - Large dip **$18**
  - Medium tray **$50**
  - Large tray **$60**
- **Pasta & noodles – Bain-Marie**: stored `priceBainMarie` in seed (see table; often matches **Large** in current seed data)
- **Mediterranean mains & Vegetarian Lebanese platters – Bain-Marie**: stored `priceBainMarie` in seed (see tables; **—** = no Bain-Marie price in seed)
- **BBQ trays**: optional Bain-Marie warmer service is **+$55 per tray** (via `bainMarieFee` in app logic for BBQ items)

## Gourmet Mini Sandwiches & Sliders (min 12)
| Item | Price |
|------|------:|
| Beef Mini Burger | $7.00 ea |
| Chicken Mini Burger | $7.00 ea |
| Crumbed Fish Mini Burger | $7.00 ea |
| Halloumi Turkish Bread | $6.50 ea |
| Salmon Mini Bagel | $7.50 ea |
| Mini Croissant | $6.50 ea |
| Mini Baguette | $6.50 ea |
| Chicken Mini Wrap | $6.50 ea |
| Falafel Mini Wrap | $5.50 ea |
| Halloumi Mini Wrap | $6.00 ea |
| Chicken Fajita Wrap | $7.00 ea |
| Mini Kibbeh Cup (2 pieces) | $5.50 ea |
| Mini Falafel Cup (2 pieces) | $4.50 ea |
| Vine Leaves Cup (2 pieces - Vegetarian) | $6.50 ea |
| Mixed Pastry Cup (3 items) | $10.50 ea |
| Vegetable Spring Rolls Cup (2 pieces) | $4.50 ea |
| Crispy Tempura Prawns with Dipping Sauce | $3.80 ea |

## Finger Food — per dozen (min 12)
| Item | Price |
|------|------:|
| Kibbeh (Per Dozen) | $30.00 / dozen |
| Meat Sambousik (Per Dozen) | $28.00 / dozen |
| Cheese Sambousik (Per Dozen) | $26.00 / dozen |
| Pizza Supreme (Per Dozen) | $26.00 / dozen |
| Vegetarian Pizza (Per Dozen) | $24.00 / dozen |
| Cheese Pizza (Per Dozen) | $24.00 / dozen |
| Zaatar Pizza (Per Dozen) | $22.00 / dozen |
| Spinach Fatayer (Per Dozen) | $26.00 / dozen |
| Vegetable Spring Rolls (Per Dozen) | $24.00 / dozen |
| Falafel Platter (Per Dozen) | $24.00 / dozen |

## Salads — Small / Medium / Large
| Item | Small | Medium | Large |
|------|------:|-------:|------:|
| Tabouli | $48 | $58 | $70 |
| Fattoush | $48 | $58 | $70 |
| Greek Salad | $48 | $58 | $70 |
| Seafood Pasta Salad | $50 | $60 | $75 |
| Fresh Garden Salad | $48 | $58 | $70 |
| Mixed Bean Salad | $48 | $58 | $70 |
| Chicken Caesar Salad | $52 | $62 | $75 |
| Rocket Salad | $48 | $58 | $70 |
| Fruit Platter | $48 | $58 | $75 |

## Finger Food / Platters — Small / Medium / Large
| Item | Small | Medium | Large |
|------|------:|-------:|------:|
| Cheese & Ham Platter | $65 | $78 | $95 |

## Dips & trays (four products; each has 4 serving options)
| Item | Medium dip | Large dip | Medium tray | Large tray |
|------|-----------:|----------:|------------:|-----------:|
| Hummus | $13 | $18 | $50 | $60 |
| Eggplant Dip (Baba Ghanoush) | $13 | $18 | $50 | $60 |
| Garlic Dip (Toum) | $13 | $18 | $50 | $60 |
| Tahini Dip | $13 | $18 | $50 | $60 |

## Pasta & noodles — Small / Medium / Large / Bain-Marie
| Item | Small | Medium | Large | Bain-Marie (tray) |
|------|------:|-------:|------:|------------------:|
| Creamy Chicken Pasta | $50 | $70 | $95 | $95 |
| Bolognese Pasta | $50 | $70 | $95 | $95 |
| Lasagna | $50 | $70 | $95 | $95 |
| Pesto Chicken Penne | $50 | $70 | $95 | $95 |
| Penne Arrabbiata | $50 | $70 | $95 | $95 |
| Chicken & Vegetable Noodles | $50 | $70 | $95 | $95 |
| Beef & Vegetable Noodles | $50 | $70 | $100 | $100 |
| Prawn & Vegetable Noodles | $55 | $75 | $100 | $100 |

## BBQ
| Item | Base Price | Optional Bain-Marie Warmer | With Warmer |
|------|-----------:|----------------------------:|------------:|
| Lamb Skewers | $9.00 / skewer | +$55 / tray | Base + $55 |
| Chicken Skewers (Shish Tawook) | $7.00 / skewer | +$55 / tray | Base + $55 |
| Kafta Skewers | $7.00 / skewer | +$55 / tray | Base + $55 |
| Chicken Wings (Per Dozen) | $24.00 / dozen | +$55 / tray | Base + $55 |

## Mediterranean mains — Small / Medium / Large / Bain-Marie
| Item | Small | Medium | Large | Bain-Marie (tray) |
|------|------:|-------:|------:|------------------:|
| Kibbeh Naye | $60 | $80 | $100 | — |
| Oven Baked Kibbeh | $60 | $80 | $100 | — |
| Fish with Tahini (Samke Harra) | $65 | $85 | $105 | $105 |
| Riz a Djej (Chicken with Rice) | $65 | $85 | $105 | $105 |
| Moghrabieh | $70 | $90 | $115 | $115 |
| Mansaf Lamb with Rice | $70 | $90 | $115 | $115 |
| Vine Leaves with Lamb Chops | $75 | $95 | $115 | $115 |
| Kafta with Potatoes | $60 | $80 | $95 | $95 |
| Stuffed Lebanese Zucchini (Kousa) | $65 | $85 | $105 | $105 |
| Chicken Stroganoff | $65 | $85 | $105 | $105 |

## Paella
| Item | Price |
|------|------:|
| Paella | $27.00 / person (min 12 people) |

## Vegetarian Lebanese — Small / Medium / Large / Bain-Marie
| Item | Small | Medium | Large | Bain-Marie (tray) |
|------|------:|-------:|------:|------------------:|
| Vine Leaves (Vegetarian) | $60 | $75 | $95 | — |
| Fried Rice | $55 | $70 | $85 | $85 |
| Lentils with Rice (Mujadara) | $55 | $70 | $85 | $85 |
| Batata Harra | $55 | $70 | $85 | $85 |
| Baked Vegetables | $55 | $70 | $85 | $85 |
| Fried Cauliflower with Tahini (Arnabit) | $55 | $70 | $85 | $85 |

## Desserts & cups
| Item | Price |
|------|------:|
| Granola (Muesli, Yogurt & Fruit) | $6.50 ea |
| Fruit Cups | $6.50 ea |
| Salad Cup | $6.50 (all options) |
| Cheesecake | $7.50 ea |
| Strawberry Tart | $7.50 ea |
