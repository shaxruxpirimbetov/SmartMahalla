from django.contrib.auth.models import User
from django.db import models
from django.core.validators import (
    MaxValueValidator, MinValueValidator,
    MinLengthValidator, MaxLengthValidator
)
from apps.rayon.models import Rayon
from decimal import Decimal


class Mahalla(models.Model):
    rayon = models.ForeignKey(Rayon, on_delete=models.CASCADE, related_name="mahalla_rayon", verbose_name="Rayon")
    name = models.CharField(max_length=100, verbose_name="Name")
    description = models.TextField(default="", verbose_name="Description")
    staff = models.ManyToManyField(User, related_name="mahalla_staff", verbose_name="Staff", blank=True)
    is_active = models.BooleanField(default=True, verbose_name="Active")
    plot = models.JSONField(default=dict, verbose_name="Plot", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Mahalla"
        verbose_name_plural = "Mahallaler"
        ordering = ["-created_at"]


class AholiVaBandlik(models.Model):
    # `mahalla` is the normal case (a snapshot entered against one Mahalla's
    # drawn boundary). `rayon` is the alternative for a snapshot entered
    # directly against a Rayon that has no such per-Mahalla breakdown yet
    # (see GeoEntityAdminPage.jsx's Rayon stats step, entityModules.js
    # RAYON_MODULE.stats) - exactly one of the two is expected to be set,
    # enforced application-side (not a DB constraint) since SQLite has no
    # convenient CHECK-constraint-via-Django story for "exactly one of".
    mahalla = models.ForeignKey(Mahalla, on_delete=models.CASCADE, verbose_name="Mahalla", related_name="aholivabandlik_mahalla", null=True, blank=True)
    rayon = models.ForeignKey(Rayon, on_delete=models.CASCADE, verbose_name="Rayon", related_name="aholivabandlik_rayon", null=True, blank=True)
    aholi_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Aholi soni")
    erkaklar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Erkaklar soni")
    ayollar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Ayollar soni")
    yosh_0_6 = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="0-6 yosh")
    yosh_0_18 = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="0-18 yosh")
    yosh_14_30 = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="14-30 yosh")
    yosh_60_plus = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="60+ yosh")
    # mahallalar_mfi_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Masjalar soni")
    oylalar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Oylalar soni")
    honadonlar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Honadonlar soni")
    kambagallik_darajasi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))], verbose_name="Kambagallik darajasi")
    rasmiy_ishsizlik_darajasi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))], verbose_name="Rasmi ishsizlik darajasi")
    ishsizlar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Ishsizlar soni")
    haqiqi_ishsizlik_darajasi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))], verbose_name="Haqiqi ishsizlik darajasi")
    mehnat_resurslari = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Mehnat resurslari")
    band_aholi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))],verbose_name="Band Aholi")
    rasmiy_royxatdagi_ishchilar = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Rasmi royxatdagi_ishchilar")
    norasmi_sektorda_bandlik = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Norasmi sektorda_bandlik")
    horiijga_ketkan_migrantlar = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Horiijga ketkan_migrantlar")
    urtacha_oylik_maosh = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Urtacha oylik maosh")
    yoshlar_ishsizligi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Yoshlar ishsizligi")
    ayollar_ishsizligi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Ayollar ishsizligi")
    nogironlar_soni_va_bandligi = models.CharField(max_length=500, default="", validators=[MinLengthValidator(3), MaxLengthValidator(500)], verbose_name="Nogironlar_soni_va_bandligi")
    ijtimoyi_himoyaga_muqtoj_aholi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Ijtimoyi himoyaga_muqtoj_aho")
    kam_taminlangan_oylalar = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Kam_taminlangan_oylalar")
    kambagal_oylalar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Kambagal_oylalar_soni")
    tugilish_mirgacia_dinamikasi = models.CharField(default="", max_length=200, validators=[MinLengthValidator(3)], verbose_name="Tugilish/mirgacia_dinamikasi")
    ogir_kasallik_holatlari = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Ogir_kasallik_holatlari")
    qaytgan_migrantlar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Qaytgan_migrantlar_soni")
    ishsizlik_ish_orni_yaratish_scenariylari = models.TextField(default="", validators=[MinLengthValidator(3), MaxLengthValidator(1000)], verbose_name="Ишсизлик/иш ўрни яратишa сценарийлари")
    norasmiy_sektorda_yillik_soliq_yuqotish = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Норасмий секторда йиллик солиқ йўқотиш")
    bola_nafaqa_oluvchilar = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Bola_nafaqa_oluvchilar")


class InfratuzulmaTaxlili(models.Model):
    # Same "exactly one of mahalla/rayon" convention as AholiVaBandlik above.
    mahalla = models.ForeignKey(Mahalla, on_delete=models.CASCADE, verbose_name="Mahalla", related_name="infratuzulmataxlili_mahalla", null=True, blank=True)
    rayon = models.ForeignKey(Rayon, on_delete=models.CASCADE, verbose_name="Rayon", related_name="infratuzulmataxlili_rayon", null=True, blank=True)
    umumiy_maydon = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Umumiy_maydon")
    # viloyat_markaziga_masofa = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Viloyat_markaziga_masofa")
    aholi_zichligi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Aholi_zichligi")
    kochalar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Koʻchalar soni")
    tomorqali_honadonlar = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Tomorqasi bor xonadonlar")
    issiqxonalar_soni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Issiqxonalar soni")
    yollar_uzunligi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Yollar_uzunligi")
    elektr_uzulishlari = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Elektr_uzulishlari")
    gaz_bilantaminlanganlar = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Gaz_bilantaminlanganlar")
    asfaltlangan_yollar_ulushi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Asfaltlangan_yollar_ulushi")
    internet_koplami_va_tezligi = models.CharField(default="", max_length=200, validators=[MinLengthValidator(3)], verbose_name="Internet_koplami_va_tezligi")
    omborxonalar = models.CharField(default="", max_length=200, validators=[MinLengthValidator(3)], verbose_name="Omborxonalar")
    suvgorish_kanallari_betonlash = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Suvgorish_kanallari_betonlash")
    suvgoriladigan_er_maydoni = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Suvgoriladigan_er_maydoni")
    toza_ichimlik_suv_taminoti = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Toza_ichimlik_suv_taminoti")
    kanalizacia_tarmogi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Kanalizacia_tarmogi")
    elektr_tarmoqlari_modernizaciasi = models.TextField(default="", validators=[MinLengthValidator(3)], verbose_name="Elektr_tarmoqlari_modernizaciasi")
    foydali_qazilmalar_konlari = models.CharField(default="", max_length=200, validators=[MinLengthValidator(3)], verbose_name="Foydali_qazilmalar_konlari")
    davlat_dasturlariga_muvofiqlik = models.TextField(default="", validators=[MinLengthValidator(3)], verbose_name="Davlat_dasturlariga_muvofiqlik")
    sanoat_zonasi_er_foydalanish = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Sanoat_zonasi_er_foydalanish")
    investiciya_jalb_qilish_bajarilishi = models.IntegerField(default=0, validators=[MinValueValidator(Decimal("0.00"))], verbose_name="Investiciya_jalb_qilish_bajarilishi")
    qurilish_materyallari_klasteri = models.TextField(default="", validators=[MinLengthValidator(3)], verbose_name="Qurilish_materyallari_klasteri")

    water_lines = models.JSONField(default=dict, blank=True, null=True)
    gas_lines = models.JSONField(default=dict, blank=True, null=True)
    elektr_lines = models.JSONField(default=dict, blank=True, null=True)
    asphalt_lines = models.JSONField(default=dict, blank=True, null=True)
    gardens = models.JSONField(default=dict, blank=True, null=True) # несколько огороды: [<garden_plots>, <garden_plots>]


class Tadbirkorlar(models.Model):
    mahalla = models.ForeignKey(Mahalla, on_delete=models.CASCADE, related_name="tadbirkorlar_mahalla")
    name = models.CharField(max_length=200, validators=[MinLengthValidator(3)], verbose_name="Name")
    owner = models.CharField(max_length=200, default="", blank=True, verbose_name="Owner")
    category = models.CharField(max_length=100, default="", verbose_name="Category")
    description = models.TextField(default="", blank=True, verbose_name="Description")
    image = models.ImageField(upload_to="business_images/", null=True, blank=True, verbose_name="Image")
    location = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")

    def __str__(self):
        return self.name