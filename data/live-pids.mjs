// Selected Mode 01 PIDs from OBDex (CC0-1.0), revision 38b564e.
// Turkish explanations are original editorial text. Not every vehicle supports every PID.
export default [
  {pid:'0104',name:'Hesaplanan motor yükü',unit:'%',note:'Aynı sürüş koşulundaki yük değişimini izle; tek değer bir arıza sınırı değildir.'},
  {pid:'0105',name:'Motor soğutma suyu sıcaklığı',unit:'°C',note:'Motorun ısınma sürecini ve sıcaklık göstergesiyle uyumunu karşılaştır.'},
  {pid:'0106',name:'Kısa dönem yakıt düzeltmesi · Bank 1',unit:'%',note:'ECU’nun o anda yaptığı karışım düzeltmesini gösterir; kapalı çevrimde değerlendir.'},
  {pid:'0107',name:'Uzun dönem yakıt düzeltmesi · Bank 1',unit:'%',note:'Zaman içinde öğrenilen düzeltmeyi gösterir; kısa dönem değeriyle birlikte oku.'},
  {pid:'0108',name:'Kısa dönem yakıt düzeltmesi · Bank 2',unit:'%',note:'İkinci bankası olan araçlarda karşılaştırma için kullanılabilir.'},
  {pid:'0109',name:'Uzun dönem yakıt düzeltmesi · Bank 2',unit:'%',note:'Bankalar arasında sürekli fark varsa koşulu ve eşlik eden kodları kaydet.'},
  {pid:'010B',name:'Emme manifoldu mutlak basıncı',unit:'kPa',note:'MAP değerini motor devri ve yükle birlikte yorumla.'},
  {pid:'010C',name:'Motor devri',unit:'dev/dk',note:'Rölanti ile sabit devir kayıtlarını aynı koşullarda karşılaştır.'},
  {pid:'010D',name:'Araç hızı',unit:'km/sa',note:'Sürüş sırasında alınan kayıtların bağlamını doğrular.'},
  {pid:'010F',name:'Emme havası sıcaklığı',unit:'°C',note:'Soğuk ilk çalıştırmada ortam sıcaklığıyla belirgin uyumsuzluğu araştır.'},
  {pid:'0110',name:'Hava kütle akışı',unit:'g/s',note:'MAF değerini devir ve yük değişimiyle beraber izle.'},
  {pid:'0111',name:'Gaz kelebeği konumu',unit:'%',note:'Komut ile gerçek tepki arasındaki ilişkiyi incelemeye yardımcı olur.'},
  {pid:'0142',name:'Kontrol modülü voltajı',unit:'V',note:'Ölçüm anındaki besleme koşulunu kaydet; elektrik sorunları başka okumaları etkileyebilir.'}
];
