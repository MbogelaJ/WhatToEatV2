// FAQ data for pregnancy nutrition
export const ALL_FAQS = [
  // ==================== FREE QUESTIONS (4 Basic/Obvious Questions) ====================
  {
    id: 'water-hydration',
    question: "How much water should I drink during pregnancy?",
    answer: "Aim for 8-10 glasses (about 2.3 liters) of water daily during pregnancy. Proper hydration helps form amniotic fluid, carry nutrients to your baby, aids digestion, and prevents constipation. Signs you need more water: dark urine, dizziness, dry mouth. If plain water is boring, add lemon or cucumber slices.",
    category: 'nutrition',
    foodTags: ['water'],
    isPremium: false
  },
  {
    id: 'fruits-vegetables-safe',
    question: "Are fruits and vegetables safe during pregnancy?",
    answer: "Yes! Fruits and vegetables are essential during pregnancy, providing vitamins, minerals, and fiber. Just wash them thoroughly under running water before eating to remove bacteria and pesticide residue. Cut away any bruised or damaged areas. Enjoy a variety of colorful produce daily.",
    category: 'produce',
    foodTags: ['vegetables', 'fruits'],
    isPremium: false
  },
  {
    id: 'cooked-meat-safe',
    question: "Is well-cooked meat safe to eat during pregnancy?",
    answer: "Yes! Well-cooked meat is safe and nutritious during pregnancy. Always cook meat to proper internal temperatures: chicken/poultry to 165°F (74°C), ground meat to 160°F (71°C), whole cuts like steak to 145°F (63°C). Avoid pink or red meat, and use a food thermometer to be sure.",
    category: 'proteins',
    foodTags: ['chicken', 'beef', 'meat'],
    isPremium: false
  },
  {
    id: 'prenatal-vitamins',
    question: "Should I take prenatal vitamins?",
    answer: "Yes! Prenatal vitamins are recommended for all pregnant women. They ensure you get adequate folic acid (prevents birth defects), iron (prevents anemia), calcium (for baby's bones), and DHA (for brain development). Start taking them as soon as you're trying to conceive or find out you're pregnant. Ask your healthcare provider for recommendations.",
    category: 'nutrition',
    foodTags: [],
    isPremium: false
  },

  // ==================== PREMIUM QUESTIONS (All detailed/specific questions) ====================
  {
    id: 'foods-avoid-completely',
    question: "What foods should I avoid completely during pregnancy?",
    answer: "AVOID COMPLETELY: 1) Raw/undercooked meat, poultry, eggs, and seafood. 2) High-mercury fish: shark, swordfish, king mackerel, tilefish, bigeye tuna. 3) Unpasteurized dairy products and juices. 4) Raw sprouts (alfalfa, clover, mung bean). 5) Deli meats and hot dogs unless heated to steaming. 6) Refrigerated smoked seafood (lox) unless cooked. 7) Alcohol - no safe amount. 8) Raw cookie dough/batter. 9) Soft cheeses from unpasteurized milk. These foods carry risks of Listeria, Salmonella, Toxoplasma, or mercury exposure which can harm your baby.",
    category: 'safety',
    foodTags: ['tuna', 'sprouts', 'cheese', 'eggs'],
    isPremium: true
  },
  {
    id: 'deli-meat-safety',
    question: "Can I eat deli meats, hot dogs, or cold cuts?",
    answer: "Deli meats, hot dogs, and cold cuts can harbor Listeria bacteria which is dangerous during pregnancy. TO EAT SAFELY: Heat deli meats and hot dogs until steaming hot (165°F/74°C) before eating. This kills any potential Listeria. AVOID: Cold deli sandwiches, unheated hot dogs, bologna, salami eaten cold. SAFER OPTIONS: Freshly cooked meat sliced at home, or heated deli meat in hot sandwiches. Listeria can grow even at refrigerator temperatures, making these foods higher risk.",
    category: 'proteins',
    foodTags: ['deli', 'hot-dogs'],
    isPremium: true
  },
  {
    id: 'soft-cheese-brie',
    question: "Can I eat soft cheeses like brie, feta, or blue cheese?",
    answer: "SAFE: Soft cheeses made from PASTEURIZED milk (check the label). In the US, most commercial brie, feta, and blue cheese are pasteurized. AVOID: Unpasteurized or raw milk soft cheeses, often found at farmers markets or imported. Mold-ripened cheeses (brie, camembert) and blue-veined cheeses from unpasteurized milk carry Listeria risk. ALWAYS SAFE: Hard cheeses (cheddar, parmesan, swiss) regardless of pasteurization, as their low moisture prevents bacterial growth. When in doubt, heat cheese until bubbling hot.",
    category: 'dairy',
    foodTags: ['cheese', 'brie', 'feta', 'blue-cheese'],
    isPremium: true
  },
  {
    id: 'fish-seafood-guide',
    question: "What fish and seafood can I eat, and how much?",
    answer: "EAT 8-12 oz (2-3 servings) per week of LOW-MERCURY fish: salmon, shrimp, pollock, tilapia, cod, catfish, sardines, anchovies, trout. LIMIT: Albacore tuna to 6 oz/week (higher mercury than light tuna). AVOID COMPLETELY: Shark, swordfish, king mackerel, tilefish, bigeye tuna - these have dangerous mercury levels. All fish must be cooked to 145°F. No raw fish, sushi, sashimi, or ceviche. Mercury accumulates and can harm baby's developing brain and nervous system. Omega-3s from safe fish are crucial for baby's development.",
    category: 'seafood',
    foodTags: ['salmon', 'shrimp', 'tilapia', 'cod', 'tuna', 'sardines'],
    isPremium: true
  },
  {
    id: 'raw-eggs-safety',
    question: "Are raw eggs or foods with raw eggs safe?",
    answer: "NO - avoid raw or undercooked eggs due to Salmonella risk. AVOID: Runny yolks, sunny-side up, soft-boiled eggs, raw cookie dough/cake batter, homemade mayonnaise, homemade Caesar dressing, homemade eggnog, mousse, tiramisu. SAFE: Fully cooked eggs (firm whites AND yolks), commercial mayonnaise (made with pasteurized eggs), store-bought Caesar dressing, pasteurized egg products. EXCEPTION: Pasteurized eggs (sold in cartons) are safe for recipes requiring less cooking. Cook eggs to 160°F/71°C to be safe.",
    category: 'proteins',
    foodTags: ['eggs'],
    isPremium: true
  },
  {
    id: 'caffeine-limit',
    question: "How much caffeine is safe during pregnancy?",
    answer: "Limit caffeine to 200mg per day maximum. APPROXIMATE AMOUNTS: 12 oz brewed coffee = 95-200mg, 12 oz black tea = 47mg, 12 oz green tea = 30-50mg, 12 oz cola = 34mg, 1 oz dark chocolate = 20mg. High caffeine intake is linked to increased miscarriage risk and low birth weight. Remember caffeine is also in energy drinks, some medications, and chocolate. Decaf coffee still has 2-15mg. SAFEST: Limit to 1 cup of coffee daily and count other caffeine sources. If you're having difficulty conceiving or have history of miscarriage, consider avoiding caffeine entirely.",
    category: 'beverages',
    foodTags: ['coffee', 'tea', 'chocolate'],
    isPremium: true
  },
  {
    id: 'alcohol-pregnancy',
    question: "Can I drink any alcohol during pregnancy?",
    answer: "NO SAFE AMOUNT of alcohol has been established during pregnancy. Complete avoidance is recommended by all major health organizations (CDC, ACOG, WHO). Alcohol crosses the placenta directly to baby and can cause Fetal Alcohol Spectrum Disorders (FASD), leading to physical abnormalities, learning disabilities, and behavioral problems. This includes beer, wine, and spirits - no type is safer. If you drank before knowing you were pregnant, stop now and talk to your healthcare provider. Cooking with wine: most alcohol cooks off if simmered 2+ hours, but avoid wine sauces with less cooking time.",
    category: 'beverages',
    foodTags: ['alcohol', 'wine', 'beer'],
    isPremium: true
  },
  {
    id: 'unpasteurized-juice-milk',
    question: "Is unpasteurized juice, cider, or raw milk safe?",
    answer: "NO - avoid all unpasteurized/raw products. This includes: raw milk, raw milk cheese, fresh-squeezed unpasteurized juice, fresh cider from farm stands. These can contain dangerous bacteria including Listeria, Salmonella, and E. coli. ALWAYS CHOOSE: Pasteurized milk and dairy, pasteurized 100% juice (check labels), commercially bottled juice. If you're unsure about cider or juice freshness, boil it first. Farmers market products are higher risk unless specifically labeled pasteurized. Pasteurization kills harmful bacteria without significantly affecting nutrition.",
    category: 'dairy',
    foodTags: ['milk', 'cheese'],
    isPremium: true
  },
  {
    id: 'washing-produce-sprouts',
    question: "How should I wash produce, and are raw sprouts safe?",
    answer: "WASHING PRODUCE: Rinse all fruits and vegetables under running water, even if you'll peel them (bacteria transfers when cutting). Use a brush for firm produce like melons and potatoes. Don't use soap or commercial produce washes - they're not more effective. Cut away damaged areas. Wash prepackaged salads again. RAW SPROUTS: AVOID COMPLETELY during pregnancy. All raw sprouts (alfalfa, clover, radish, mung bean) are grown in warm, humid conditions where bacteria thrive. Even 'clean' looking sprouts can harbor Salmonella or E. coli. Only eat sprouts if thoroughly cooked until steaming.",
    category: 'produce',
    foodTags: ['sprouts', 'vegetables'],
    isPremium: true
  },
  {
    id: 'eating-for-two-myth',
    question: "How many extra calories do I need? Am I 'eating for two'?",
    answer: "MYTH BUSTED: You're not eating for two adults! ACTUAL NEEDS: First trimester - no extra calories needed. Second trimester - about 340 extra calories/day. Third trimester - about 450 extra calories/day. That's roughly equivalent to a yogurt parfait with fruit and granola - not double portions! FOCUS ON: Quality over quantity. Nutrient-dense foods, adequate protein (75-100g daily), iron, folate, calcium, omega-3s. WEIGHT GAIN GUIDELINES (varies by pre-pregnancy BMI): Underweight 28-40 lbs, Normal weight 25-35 lbs, Overweight 15-25 lbs, Obese 11-20 lbs. Consult your provider for personalized guidance.",
    category: 'nutrition',
    foodTags: ['yogurt'],
    isPremium: true
  },
  {
    id: 'liver-vitamin-a',
    question: "Is liver or high-vitamin-A foods safe?",
    answer: "LIMIT liver during pregnancy. Liver is extremely high in retinol (preformed vitamin A). Too much retinol can cause birth defects, especially in the first trimester. RECOMMENDATIONS: Avoid liver pâté entirely. If eating liver, limit to very small portions (1-2 oz) no more than once a month. Avoid vitamin A supplements (retinol form). SAFE: Beta-carotene from plants (carrots, sweet potatoes) - your body converts only what it needs. Prenatal vitamins with vitamin A as beta-carotene, not retinol. Check supplement labels carefully.",
    category: 'proteins',
    foodTags: ['liver', 'carrots', 'sweet potato'],
    isPremium: true
  },
  {
    id: 'food-handling-safety',
    question: "What about eating out, buffets, and food handling safety?",
    answer: "EATING OUT: Choose restaurants with good hygiene ratings. Avoid rare/medium meat - request well-done. Skip raw bars, sushi restaurants (unless cooked options), and soft-serve ice cream machines. BUFFETS: Higher risk - food may sit at unsafe temperatures. If eating buffet, choose freshly replenished hot items. LEFTOVERS: Refrigerate within 2 hours. Eat within 2-3 days (not 4-5). Reheat to 165°F/74°C until steaming. FOOD HANDLING: Follow 'Clean, Separate, Cook, Chill.' Wash hands often, separate raw meat from other foods, cook to safe temps, refrigerate promptly. Avoid pre-cut melons left out, food from dented cans.",
    category: 'safety',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'sushi-sashimi-ceviche',
    question: "Can I eat sushi, sashimi, ceviche, or raw shellfish?",
    answer: "AVOID all raw and undercooked seafood during pregnancy. This includes: sushi with raw fish, sashimi, raw oysters, raw clams, ceviche (acid doesn't kill parasites), poke bowls with raw fish, tartare. RISKS: Parasites, Vibrio, Listeria, and other bacteria that can cause serious illness in pregnancy. SAFE ALTERNATIVES: Cooked sushi rolls (shrimp tempura, eel, cooked crab), vegetable rolls, fully cooked poke bowls. Many sushi restaurants offer 'pregnancy-safe' options - just ask! All fish should be cooked to 145°F/63°C internal temperature.",
    category: 'seafood',
    foodTags: ['sushi', 'shrimp', 'crab'],
    isPremium: true
  },
  {
    id: 'smoked-salmon-lox',
    question: "Can I eat smoked salmon, lox, or smoked seafood?",
    answer: "REFRIGERATED smoked seafood (lox, nova-style salmon, kippered fish, smoked trout) should be AVOIDED unless cooked into a dish to 165°F. It can contain Listeria which grows even at refrigerator temperatures. SAFE OPTIONS: Canned or shelf-stable smoked fish (heat-processed). Smoked salmon cooked in a hot dish (casserole, quiche, hot bagel with melted cream cheese and heated lox). Hot-smoked fish that reached 145°F during smoking process. When in doubt, heat smoked fish until steaming before eating.",
    category: 'seafood',
    foodTags: ['salmon', 'smoked-fish'],
    isPremium: true
  },
  {
    id: 'nuts-seeds-safety',
    question: "Are nuts and seeds safe during pregnancy?",
    answer: "YES! Nuts and seeds are excellent during pregnancy - rich in healthy fats, protein, fiber, and minerals. SAFE OPTIONS: Almonds, walnuts, cashews, peanuts, sunflower seeds, pumpkin seeds, chia seeds, flax seeds (ground). EXCEPTION: Brazil nuts - limit to 1-2 per day due to very high selenium content. ALLERGY NOTE: Current research suggests eating nuts during pregnancy does NOT increase baby's allergy risk and may actually help prevent allergies. Avoid if YOU have a nut allergy. Choose unsalted when possible to limit sodium.",
    category: 'nuts',
    foodTags: ['almonds', 'walnuts', 'peanuts', 'chia seeds', 'flax seeds'],
    isPremium: true
  },
  {
    id: 'premade-deli-salads',
    question: "Are premade deli salads safe (tuna, egg, chicken salad)?",
    answer: "HIGHER RISK - best to avoid or make fresh at home. Store-made deli salads (tuna salad, egg salad, chicken salad, potato salad) have higher Listeria risk due to: handling by multiple people, time sitting at deli counter, mayo-based mixture at variable temperatures. SAFER OPTIONS: Make your own at home with fresh ingredients. If buying premade, choose sealed packages with clear dates, eat immediately, and ensure it's been properly refrigerated. Avoid deli salads from salad bars or that have been sitting out.",
    category: 'safety',
    foodTags: ['tuna', 'chicken', 'eggs', 'potato'],
    isPremium: true
  },
  {
    id: 'important-nutrients',
    question: "What nutrients are most important during pregnancy?",
    answer: "KEY NUTRIENTS: 1) FOLIC ACID (400-800mcg) - prevents neural tube defects; leafy greens, fortified cereals, prenatal vitamin. 2) IRON (27mg) - prevents anemia, supports blood volume; red meat, spinach, beans, fortified cereals. 3) CALCIUM (1000mg) - builds baby's bones; dairy, fortified plant milk, leafy greens. 4) DHA/OMEGA-3 (200-300mg) - brain development; fatty fish, fish oil, algae supplements. 5) PROTEIN (75-100g) - tissue growth; meat, eggs, dairy, legumes. 6) VITAMIN D (600IU) - calcium absorption; sunlight, fortified foods, supplements. 7) CHOLINE (450mg) - brain development; eggs, liver, soybeans. Take prenatal vitamins to cover gaps.",
    category: 'nutrition',
    foodTags: ['spinach', 'eggs', 'salmon', 'beans', 'milk'],
    isPremium: true
  },
  {
    id: 'pregnancy-cravings',
    question: "What do pregnancy cravings mean?",
    answer: "Cravings are extremely common - up to 90% of pregnant women experience them. COMMON CRAVINGS: Sweet foods, salty/savory foods, sour/citrus, spicy foods, specific textures. WHAT THEY MAY MEAN: Often hormone-driven rather than nutrient deficiency. Some theories: craving dairy = calcium need, craving red meat = iron need. But there's limited scientific evidence for this. ICE CRAVINGS (pica): May indicate iron deficiency - tell your provider. MANAGING CRAVINGS: Indulge in moderation when cravings are for safe foods. Find healthier alternatives when possible. If craving non-food items (dirt, clay), talk to your doctor immediately.",
    category: 'general',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'seafood-benefits',
    question: "Should I avoid all seafood, or is some beneficial?",
    answer: "DON'T avoid all seafood - low-mercury fish is HIGHLY BENEFICIAL! Omega-3 fatty acids (DHA, EPA) from fish are crucial for baby's brain and eye development. Studies show babies of mothers who ate fish have better developmental outcomes. EAT 8-12 oz weekly of: salmon, sardines, anchovies, herring, trout, shrimp, tilapia, cod, pollock. AVOID: High-mercury fish (shark, swordfish, king mackerel, tilefish, bigeye tuna) and all raw fish. If you don't eat fish, consider a DHA supplement from fish oil or algae. The benefits of low-mercury fish far outweigh the risks.",
    category: 'seafood',
    foodTags: ['salmon', 'sardines', 'shrimp', 'tilapia', 'cod'],
    isPremium: true
  },
  {
    id: 'spicy-food-pregnancy',
    question: "Can I eat spicy food during pregnancy?",
    answer: "YES - spicy food is safe during pregnancy and won't harm your baby. However, it may worsen common pregnancy symptoms: HEARTBURN: Spicy foods can trigger or worsen acid reflux, which is already common in pregnancy. DIGESTIVE DISCOMFORT: May cause stomach upset or diarrhea in some. If you tolerated spicy food before pregnancy and still enjoy it, continue eating it. TIPS: Have smaller portions of spicy food. Avoid lying down right after eating spicy meals. Keep antacids handy. Spicy food does NOT induce labor (despite the old wives' tale) and does NOT affect baby's temperament.",
    category: 'general',
    foodTags: ['spicy'],
    isPremium: true
  },
  {
    id: 'herbal-tea-supplements',
    question: "Are herbal teas and supplements safe during pregnancy?",
    answer: "SOME are safe, others should be avoided. GENERALLY SAFE: Ginger tea (great for nausea - limit to 1g dried ginger daily), peppermint, rooibos, lemon balm in moderation. USE WITH CAUTION: Chamomile (limit 1-2 cups daily), raspberry leaf (usually only in third trimester). AVOID: Licorice root, dong quai, pennyroyal, blue/black cohosh, St. John's wort, ginseng, comfrey, ephedra, kava. SUPPLEMENTS: Only take supplements approved by your provider. Avoid herbal weight loss or cleansing products. Prenatal vitamins are safe and recommended. 'Natural' doesn't mean safe during pregnancy.",
    category: 'beverages',
    foodTags: ['ginger', 'tea', 'peppermint'],
    isPremium: true
  },
  {
    id: 'fast-food-processed',
    question: "Is fast food or processed food safe during pregnancy?",
    answer: "OCCASIONAL fast food and processed food is okay, but limit it. CONCERNS: High sodium can worsen pregnancy swelling and blood pressure. High saturated fat doesn't support optimal health. Empty calories without nutrients baby needs. Hidden ingredients (MSG, excess sugar). BETTER CHOICES: Grilled options over fried. Skip raw salads at fast food (contamination risk). Choose restaurants with visible kitchen/hygiene. Avoid soft-serve ice cream machines (bacterial growth risk). BALANCE: If eating fast food, balance with nutrient-dense foods rest of day. Meal prep when possible for healthier convenient options.",
    category: 'general',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'prenatal-vitamins',
    question: "Do I need prenatal vitamins, and when should I start?",
    answer: "YES - prenatal vitamins are strongly recommended. START: Ideally 1-3 months before conception, but start as soon as you know you're pregnant. KEY NUTRIENTS IN PRENATALS: Folic acid (400-800mcg) - critical for preventing neural tube defects in first 28 days. Iron - prevents anemia. Calcium - bones. DHA - brain development. Vitamin D, B vitamins, iodine. FOOD ISN'T ENOUGH: Even with perfect diet, it's hard to get adequate folic acid and iron. Prenatal vitamins are an insurance policy. TIPS: Take with food if nauseous. If you can't tolerate pills, try gummies (check they contain iron). Continue through breastfeeding.",
    category: 'nutrition',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'foods-for-symptoms',
    question: "What foods help with nausea, constipation, or anemia?",
    answer: "FOR NAUSEA: Ginger (tea, candies, ale), plain crackers before rising, cold foods (less smell), small frequent meals, lemon/citrus, bland foods (BRAT: bananas, rice, applesauce, toast), protein snacks. FOR CONSTIPATION: High-fiber foods (fruits, vegetables, whole grains, beans), prunes/prune juice (natural laxative), plenty of water, physical activity. FOR ANEMIA: Iron-rich foods - red meat (best absorbed), spinach, lentils, fortified cereals, beans. Pair plant iron with vitamin C for absorption. Avoid calcium/coffee/tea with iron-rich meals. Your provider may recommend iron supplements.",
    category: 'nutrition',
    foodTags: ['ginger', 'banana', 'rice', 'spinach', 'lentils', 'beans'],
    isPremium: true
  },
  {
    id: 'miscarriage-foods',
    question: "Can certain foods cause miscarriage or preterm birth?",
    answer: "HIGH-RISK FOODS TO AVOID: 1) Alcohol - linked to miscarriage, stillbirth, FASD. 2) High-mercury fish - can affect fetal brain development. 3) Listeria sources (deli meat, unpasteurized products) - can cause miscarriage, stillbirth, severe illness. 4) Raw/undercooked foods - infection risk. LESS CLEAR EVIDENCE: Very high caffeine (>300mg) may increase miscarriage risk. Pineapple, papaya, spicy food - myths with no solid evidence when eaten in normal amounts. IMPORTANT: Most miscarriages are due to chromosomal abnormalities, not food. Focus on avoiding clearly risky foods and eating a balanced diet. Talk to your provider about specific concerns.",
    category: 'safety',
    foodTags: ['pineapple', 'papaya', 'coffee'],
    isPremium: true
  },
  // Additional specific food questions
  {
    id: 'sushi-pregnancy',
    question: "Can I eat sushi while pregnant?",
    answer: "Raw fish sushi should be avoided during pregnancy due to risk of parasites and bacteria. However, cooked sushi rolls (like shrimp tempura, eel, or fully cooked fish) and vegetable rolls are generally safe options. Many sushi restaurants offer pregnancy-safe options - just ask!",
    category: 'seafood',
    foodTags: ['sushi', 'salmon', 'tuna', 'shrimp'],
    isPremium: true
  },
  {
    id: 'tuna-pregnancy',
    question: "Can I eat tuna while pregnant?",
    answer: "Light canned tuna (skipjack) is lower in mercury - you can have 2-3 servings per week. Albacore (white) tuna has more mercury - limit to 1 serving per week. Avoid bigeye tuna entirely. One serving is about 4 ounces (113g). Always choose cooked tuna, never raw.",
    category: 'seafood',
    foodTags: ['tuna'],
    isPremium: true
  },
  {
    id: 'rare-steak',
    question: "Can I eat rare steak while pregnant?",
    answer: "NO - all beef should be cooked to at least 145°F (63°C) with a 3-minute rest time during pregnancy. Medium-rare and rare steaks may contain harmful bacteria like Toxoplasma and E. coli. Order steaks medium-well or well-done. Use a meat thermometer to check. Ground beef should reach 160°F.",
    category: 'proteins',
    foodTags: ['beef', 'steak'],
    isPremium: true
  },
  {
    id: 'coffee-pregnancy',
    question: "Can I drink coffee while pregnant?",
    answer: "Yes, in moderation. Limit caffeine to 200mg per day - about one 12oz cup of brewed coffee. High caffeine intake is linked to increased miscarriage risk. Count caffeine from all sources including tea, cola, and chocolate. Consider switching to half-caff or decaf. Some women are more sensitive to caffeine during pregnancy.",
    category: 'beverages',
    foodTags: ['coffee'],
    isPremium: true
  },
  {
    id: 'herbal-tea-safety',
    question: "Can I drink herbal tea while pregnant?",
    answer: "SAFE in moderation: Ginger (great for nausea), peppermint, rooibos, lemon balm. LIMIT: Chamomile to 1-2 cups daily. AVOID: Licorice root, dong quai, pennyroyal, blue/black cohosh, excessive amounts of any single herb. Herbal teas are unregulated - choose reputable brands. Always check with your provider about specific herbal teas.",
    category: 'beverages',
    foodTags: ['tea', 'ginger', 'peppermint'],
    isPremium: true
  },
  {
    id: 'pineapple-myth',
    question: "Is pineapple safe during pregnancy?",
    answer: "YES - this is a myth. Pineapple is safe during pregnancy in normal food amounts. It contains bromelain, which in VERY large concentrated amounts could theoretically affect the cervix, but you would need to eat 7-10 whole pineapples at once. Enjoy pineapple as part of a balanced diet - it's a good source of vitamin C and manganese.",
    category: 'produce',
    foodTags: ['pineapple'],
    isPremium: true
  },
  {
    id: 'papaya-safety',
    question: "Can I eat papaya while pregnant?",
    answer: "RIPE papaya is SAFE and nutritious during pregnancy, providing vitamin C and folate. However, UNRIPE (green) papaya contains papain and latex which may cause uterine contractions and should be avoided. Ensure papaya is fully ripe (yellow/orange skin, soft flesh) before eating. Avoid papaya enzyme supplements.",
    category: 'produce',
    foodTags: ['papaya'],
    isPremium: true
  },
  {
    id: 'grapes-pregnancy',
    question: "Are grapes safe during pregnancy?",
    answer: "YES - grapes are safe during pregnancy! They provide vitamins, antioxidants (especially red/purple grapes), and hydration. Wash thoroughly before eating. The myth about grapes causing miscarriage has no scientific basis. Some women avoid grapes in late pregnancy due to natural compounds, but normal consumption is fine. Don't eat excessive amounts due to sugar content.",
    category: 'produce',
    foodTags: ['grapes'],
    isPremium: true
  },
  {
    id: 'sprouts-safety',
    question: "Are sprouts safe during pregnancy?",
    answer: "NO - raw sprouts should be AVOIDED entirely during pregnancy. All raw sprouts (alfalfa, clover, radish, mung bean, broccoli sprouts) are grown in warm, humid conditions ideal for bacterial growth. Even 'clean' looking sprouts can harbor Salmonella, E. coli, or Listeria. Only eat sprouts if thoroughly cooked until steaming hot. This includes sprouts on sandwiches and in salads.",
    category: 'produce',
    foodTags: ['sprouts'],
    isPremium: true
  },
  {
    id: 'brie-cheese',
    question: "Is brie cheese safe during pregnancy?",
    answer: "Brie made from PASTEURIZED milk is safe during pregnancy. In the US, most commercial brie is pasteurized - check the label. AVOID unpasteurized brie or imported soft-ripened cheeses unless you're certain they're pasteurized. Even pasteurized brie should be avoided from deli counters (Listeria risk). When in doubt, heat until bubbling hot - this kills any potential bacteria.",
    category: 'dairy',
    foodTags: ['brie', 'cheese'],
    isPremium: true
  }
];
