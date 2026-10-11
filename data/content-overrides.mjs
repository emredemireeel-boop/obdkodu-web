// Replace absolute claims in selected legacy lists with vehicle-dependent wording.
export default {
  P0102: {
    symptoms: ['Motor arıza lambası yanabilir.','Zor çalışma, stop etme veya düzensiz rölanti görülebilir.','Gaz tepkisi ve çekiş azalabilir.'],
    causes: ['MAF konnektöründe çıkma veya temas sorunu','Sensör beslemesi, şase veya sinyal hattında arıza','Emme hattında kısıt veya sensörün kendisinde sorun']
  },
  P0340: {
    symptoms: ['Motor arıza lambası yanabilir.','Marş uzayabilir veya motor çalışmayabilir.','Çalışırken durma ya da düzensiz güç üretimi görülebilir.'],
    causes: ['Eksantrik mili konum sensörü devresinde bağlantı sorunu','Sensör sinyalinde kesinti','Mekanik zamanlama veya ilgili kumanda sorunu']
  },
  P0401: {
    symptoms: ['Motor arıza lambası yanabilir.','Bazı araçlarda performans veya yakıt tüketimi etkilenebilir.','Belirgin sürüş belirtisi görülmeyebilir.'],
    causes: ['EGR geçişlerinde kurum birikimi','EGR valfi veya kumanda devresinde sorun','Akış geri bildiriminde yanlış ölçüm']
  },
  P0442: {
    symptoms: ['Motor arıza lambası yanabilir.','Sürüşte belirgin bir fark olmayabilir.','Yakıt buharı kokusu varsa kaçak güvenli biçimde araştırılmalıdır.'],
    causes: ['Depo kapağı veya contasında sızdırmazlık sorunu','EVAP hortumu ve bağlantılarında küçük kaçak','Purge veya vent valfinin tam kapanmaması']
  },
  P0456: {
    symptoms: ['Motor arıza lambası yanabilir.','Araç normal sürülebilir; belirti olmaması kaçağı dışlamaz.'],
    causes: ['Depo kapağı veya dolum ağzında sızdırmazlık sorunu','EVAP hortumu veya bağlantısında küçük kaçak','Purge veya vent valfinde sızdırma']
  },
  P2452: {
    symptoms: ['Motor veya DPF uyarısı yanabilir.','Güç kısıtlaması görülebilir.','Rejenerasyon davranışı etkilenebilir.'],
    causes: ['DPF basınç sensörü devresinde elektriksel hata','Sensör hortumlarında tıkanma, erime veya kaçak','Basınç geri bildirimini etkileyen bağlantı sorunu']
  }
};
