from google.genai import Client
from decouple import config

api_key = config('API_KEY')
client = Client(api_key=api_key)

# res = client.models.generate_content(model="gemini-2.5-flash", contents="hi")
# print(res.candidates[0].content.parts[0].text)


def ask_analysis(avb, infra):
    data = str([avb, infra]).replace(" ", "")
    txt = """
    O‘zbekistondagi barcha asosiy sohalarda xotin-qizlar faoliyati
    1. Tikuvchilik va to‘qimachilik
    Bu sohada xotin-qizlar eng ko‘p:
    Atele va moda studiyalari ochish
    Maktab formasi, milliy kiyimlar tikish
    Qo‘l mehnati buyumlari (so‘zana, kada, uloq, qo‘lda to‘qish)
    Oilaviy sexlarda ishlab chiqarish
    2. Ovqatlanish, konditerlik va Catering
    Ko‘plab xotinlar:
    Tort, shirinliklar, pishiriqlar tayyorlash
    Oshxona, mini-kafe ochish
    Tuy, tadbirlar uchun xizmat ko‘rsatish
    Milliy taomlar tayyorlab onlayn sotish
    3. Go‘zallik sohasi (Beauty)
    Bu yo‘nalish eng tez rivojlanayotganlardan:
    Salonlar (parikmaxer, vizajist, brovist, manikyur)
    Kosmetologiya (masaj, parvarish, chizmakarlik)
    Byuti kurslar ochish
    Kosmetika sotish va brending qilish
    4. Mahsulot ishlab chiqarish
    Xotin-qizlarning katta qismi:
    Sun’iy va tabiiy hidlar (aromatlar)
    Somon, gilam, qolinchak ishlab chiqarish
    Suvenirlar, bijuteriya, qo‘lda yasalgan buyumlar
    Organik krem, sovun, shampunlar ishlab chiqarish
    5. Qishloq xo‘jaligi va chorvachilik
    Qishloqlarda xotin-qizlar:
    Tovuq, qoramol, echki, qo‘y boqish
    Asalchilik
    Gulchilik va parvarish
    Ipak qurti parvarishi
    Sabzavot, poliz mahsulotlari yetishtirish
    6. Ta’lim va o‘quv xizmatlari
    O‘qituvchi va trener sifatida:
    Bolalarga repetitorlik
    Til kurslari
    Kompyuter, dizayn, SMM kurslari
    Psixologiya va bolalar rivoji markazlari
    7. Savdo va onlayn biznes
    Ayollar bu sohada juda faol:
    Instagram, Telegram orqali sotuv
    Uy-ro‘zg‘or, kosmetika, kiyim-kechak savdosi
    Marketpleyslarda (Uzum, Wildberries) savdo qilish
    Xitoydan tovar olib kelib sotish
    8. Xizmat ko‘rsatish sohalari
    Xotin-qizlar:
    Klining xizmatlari (uy yuvish, ofis yuvish)
    Ta’lim markazlari va bolalar bog‘chalari
    Ijara xizmatlari (kostyum, bayram xizmatlari)
    Fotograf va videograf xizmatlari
    Tadbir tashkil qilish
    9. Iqtisod va boshqaruv (ofis sohalari)
    Bank, buxgalteriya va IT sohalarida ham ko‘pchilik:
    Buxgalterlik firmalari
    HR va kadrlar agentligi
    Yuristik xizmatlar
    IT (SMM, grafik dizayn, veb-razrabotka)
    10. Madaniyat, sport va san’at
    Juda ko‘p ayollar:
    Xoreografiya studiyalari
    Musiqa darslari
    Rassomlik, qo‘l mehnati
    Fitnes, yoga, pilates studiyalari
    Xulosa
    O‘zbekistonda xotin-qizlar deyarli barcha sohalarda tadbirkorlik qilayapti:
    Tikuvchilik
    Konditerlik
    Byuti
    Onlayn savdo
    Qishloq xo‘jaligi
    Ta’lim
    Xizmat ko‘rsatish
    Sport, madaniyat
    IT va oflayn bizneslar
    """.replace("\n", "")
    res = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f'''
ТЫ - ИИ аналитик Анализируй данные
Делай вывод смотря на данные города о том, что какие бизнесы и тд

Данные: {data + txt}
ВАЖНО:
ответ на таком языке как на контексте
Твой ответ должен быть в только формате
И главное чтою текста было больше
{{
  "good_businesses": [],
  "missing_businesses": [],
  "urgent_city_problems": [],
  "strong_sides": []
}}
'''
    )
    return res.candidates[0].content.parts[0].text