/* ------------------------------------------------------------------ */
/* Tööpakkumised                                                       */
/* ------------------------------------------------------------------ */
var JOBS = [
  {id:1, co:"CleanSpace Care", ini:"CS", pay:7.00, km:2.5, days:2, skill:"commercial",
   et:"Ärikliendi öökoristaja", en:"Commercial night cleaner",
   shifts:["night","evening"], accom:["max10","stepfree","lownoise"],
   reqEt:["Ärikliendi kogemus","Eesti või vene keel"], reqEn:["Commercial experience","Estonian or Russian"],
   firstEt:"Tere! Nägin su profiili. Otsime inimest 3 õhtuks nädalas, Ülemiste kontorihoonesse.",
   firstEn:"Hi! Saw your profile. We need someone 3 evenings a week at the Ülemiste office building."},

  {id:2, co:"Büroohaldus OÜ", ini:"BH", pay:8.20, km:1.2, days:1, skill:"commercial",
   et:"Hommikune kontorikoristaja", en:"Morning office cleaner",
   shifts:["morning","parttime"], accom:["max10","stepfree","nochem"],
   reqEt:["Kell 6–9","Iseseisev töö"], reqEn:["6–9 am","Works independently"],
   firstEt:"Tere! Meil on vaba hommikune ring kesklinnas. Kas 6–9 sobiks?",
   firstEn:"Hello! We have a morning round open downtown. Would 6–9 work for you?"},

  {id:3, co:"Polaris Hoolduskeskus", ini:"PH", pay:9.50, km:6.8, days:4, skill:"floor",
   et:"Põrandahooldaja", en:"Floor care technician",
   shifts:["night"], accom:["mask","stepfree","max10"],
   reqEt:["Masinatöö kogemus","Öine vahetus"], reqEn:["Machine experience","Night shift"],
   firstEt:"Tere! Otsime põrandamasina kogemusega inimest.",
   firstEn:"Hi! We're looking for someone with floor machine experience."},

  {id:4, co:"Keskuse Kaubamaja", ini:"KK", pay:7.50, km:3.4, days:3, skill:"commercial",
   et:"Kaubanduskeskuse päevakoristaja", en:"Shopping centre day cleaner",
   shifts:["morning","evening","parttime"], accom:["stepfree","lownoise","sitting","max10"],
   reqEt:["Klienditeeninduse hoiak","Kerge füüsiline töö"], reqEn:["Customer-facing","Light physical work"],
   firstEt:"Tere! Meil on vaba koht päevases tiimis, vahetused 4 tundi.",
   firstEn:"Hi! We have an opening on the day team, 4-hour shifts."},

  {id:5, co:"Hansa Pesumaja", ini:"HP", pay:8.00, km:4.1, days:6, skill:"laundry",
   et:"Pesumaja operaator", en:"Laundry operator",
   shifts:["morning","fulltime"], accom:["stepfree","max10","sitting"],
   reqEt:["Vahetustega töö","Täiskoormus"], reqEn:["Shift work","Full-time"],
   firstEt:"Tere! Otsime pesumajja täiskohaga inimest.",
   firstEn:"Hi! We're hiring full-time for the laundry."},

  {id:6, co:"Hotell Marina", ini:"HM", pay:7.80, km:2.9, days:2, skill:"commercial",
   et:"Hotelli toateenindaja", en:"Hotel room attendant",
   shifts:["morning","weekend"], accom:["stepfree","max10"],
   reqEt:["Nädalavahetused","Hoolikus"], reqEn:["Weekends","Attention to detail"],
   firstEt:"Tere! Nädalavahetuse vahetused on vabad.",
   firstEn:"Hi! Weekend shifts are open."},

  {id:7, co:"Klaarkliin OÜ", ini:"KL", pay:9.00, km:5.2, days:5, skill:"windows",
   et:"Aknapesija (1.–2. korrus)", en:"Window cleaner (floors 1–2)",
   shifts:["morning"], accom:["stepfree","nochem"],
   reqEt:["Redeli kasutamine","Hommikune vahetus"], reqEn:["Ladder use","Morning shift"],
   firstEt:"Tere! Objektid on Mustamäel ja Õismäel.",
   firstEn:"Hi! The sites are in Mustamäe and Õismäe."},

  {id:8, co:"Toidutehas Verde", ini:"TV", pay:8.60, km:7.5, days:3, skill:"kitchen",
   et:"Köögi puhastustööline", en:"Kitchen cleaning operative",
   shifts:["evening","night"], accom:["mask","stepfree","max10"],
   reqEt:["Toiduohutuse koolitus","Märg keskkond"], reqEn:["Food safety training","Wet environment"],
   firstEt:"Tere! Koolituse teeme ise, kogemust pole vaja.",
   firstEn:"Hi! We provide the training, no experience needed."},

  {id:9, co:"Logistika Depoo AS", ini:"LD", pay:8.40, km:9.1, days:7, skill:"warehouse",
   et:"Laoabiline (kerged kaubad)", en:"Warehouse assistant (light goods)",
   shifts:["morning","parttime"], accom:["max10","stepfree","lownoise","sitting"],
   reqEt:["Skanneri kasutamine","Kerged pakid"], reqEn:["Scanner use","Light parcels"],
   firstEt:"Tere! Töö on pakkide skaneerimine, raskusi ei tõsta.",
   firstEn:"Hi! The work is scanning parcels, no heavy lifting."},

  {id:10, co:"Sõle Spordikeskus", ini:"SS", pay:7.20, km:1.8, days:1, skill:"commercial",
   et:"Spordikeskuse koristaja", en:"Sports centre cleaner",
   shifts:["evening","weekend","parttime"], accom:["stepfree","lownoise","max10","nochem"],
   reqEt:["Õhtused tunnid","Riietusruumid"], reqEn:["Evening hours","Changing rooms"],
   firstEt:"Tere! Vahetus on 18–21, bussipeatus maja ees.",
   firstEn:"Hi! The shift is 18–21, bus stop right outside."},

  {id:11, co:"Puhas Maja OÜ", ini:"PM", pay:7.60, km:3.0, days:2, skill:"commercial",
   et:"Trepikodade koristaja", en:"Stairwell cleaner",
   shifts:["evening","parttime"], accom:["stepfree","max10","sitting"],
   reqEt:["Oma tempos töö","Kortermajad"], reqEn:["Work at your own pace","Apartment buildings"],
   firstEt:"Tere! Marsruut on 4 maja, teed oma tempos.",
   firstEn:"Hi! The route is 4 buildings, you set your own pace."},

  {id:12, co:"Tartu Ärimaja", ini:"TÄ", pay:8.90, km:11.4, days:4, skill:"commercial",
   et:"Õhtune koristaja", en:"Evening cleaner",
   shifts:["evening","parttime","fulltime"], accom:["stepfree","max10","lownoise","nochem"],
   reqEt:["Kell 17–21","Lifti kasutus"], reqEn:["5–9 pm","Lift access"],
   firstEt:"Tere! Oleme Tartus, aga transpordi hüvitame.",
   firstEn:"Hi! We're in Tartu, but travel is reimbursed."},

  {id:13, co:"Kino Linnuke", ini:"KL", pay:7.40, km:2.1, days:1, skill:"commercial",
   et:"Saalide koristaja", en:"Auditorium cleaner",
   shifts:["evening","night","weekend"], accom:["stepfree","max10","lownoise"],
   reqEt:["Pärast seansse","Kiire tempo"], reqEn:["After screenings","Fast pace"],
   firstEt:"Tere! Töö käib seansside vahel, 2–3 õhtut nädalas.",
   firstEn:"Hi! Work happens between screenings, 2–3 evenings a week."},

  {id:14, co:"Hoolekandekeskus Lehola", ini:"HL", pay:8.10, km:4.6, days:3, skill:"commercial",
   et:"Üldruumide koristaja", en:"Common areas cleaner",
   shifts:["morning","evening","parttime"], accom:["stepfree","max10","lownoise","sitting","nochem"],
   reqEt:["Rahulik keskkond","Taustakontroll"], reqEn:["Quiet environment","Background check"],
   firstEt:"Tere! Meil on rahulik maja, tempo on inimlik.",
   firstEn:"Hi! It's a calm building and the pace is humane."},

  {id:15, co:"Põrandapesu Grupp", ini:"PG", pay:10.20, km:6.0, days:5, skill:"floor",
   et:"Põrandate poleerija", en:"Floor polisher",
   shifts:["evening","parttime"], accom:["stepfree","max10","mask"],
   reqEt:["Masina väljaõpe kohapeal","Õhtune vahetus"], reqEn:["On-site machine training","Evening shift"],
   firstEt:"Tere! Masina väljaõppe teeme ise, 2 õhtut nädalas.",
   firstEn:"Hi! We train you on the machine, 2 evenings a week."}
];

/* ------------------------------------------------------------------ */
/* Kuulutuste täistekstid                                              */
/* ------------------------------------------------------------------ */
var DETAILS = {
 1:{et:{desc:["Koristad Ülemiste ärikvartali kahte kontorikorrust pärast seda, kui töötajad on lahkunud. Töö käib kindla kontrollnimekirja järgi: prügi, lauapinnad, köögid, WC-d ja koridorid.",
              "Töötad üksi või paarilisega, keegi ei kiirusta taga. Juhendaja käib esimesel kahel korral kaasas."],
       hours:"E, K, R kell 18:00–22:00", place:"Ülemiste City, Tallinn", start:"Kokkuleppel, soovitavalt 2 nädala jooksul",
       offers:["Tööriided ja vahendid tööandjalt","Transpordihüvitis 30 €/kuus","Palk kaks korda kuus"]},
    en:{desc:["You clean two office floors in the Ülemiste business quarter after staff have left. The work follows a fixed checklist: bins, desk surfaces, kitchens, toilets and corridors.",
              "You work alone or with one colleague, and nobody rushes you. A supervisor joins you for the first two shifts."],
       hours:"Mon, Wed, Fri 18:00–22:00", place:"Ülemiste City, Tallinn", start:"By agreement, ideally within 2 weeks",
       offers:["Workwear and equipment provided","€30/month travel allowance","Paid twice a month"]}},

 2:{et:{desc:["Hommikune ring kolmes kesklinna kontoris enne tööpäeva algust. Igas majas kulub umbes tund.",
              "Võtmed ja ligipääsukaardid saad kätte esimesel päeval. Ringi järjekorra võid ise paika panna."],
       hours:"E–R kell 6:00–9:00", place:"Tallinna kesklinn, 3 objekti", start:"Niipea kui võimalik",
       offers:["Lõplik graafik kokkuleppel","Lõhnatud pesuvahendid","Tööleping, mitte käsundusleping"]},
    en:{desc:["A morning round through three downtown offices before the working day starts. Each building takes about an hour.",
              "You get keys and access cards on day one. The order of the round is yours to decide."],
       hours:"Mon–Fri 6:00–9:00", place:"Tallinn city centre, 3 sites", start:"As soon as possible",
       offers:["Final schedule by agreement","Fragrance-free products","A proper employment contract"]}},

 3:{et:{desc:["Hooldad suurte kaubandus- ja tootmispindade põrandaid: pesumasin, poleerija, vahatamine.",
              "Masinate väljaõpe toimub kohapeal. Varasem kogemus on plussiks, aga mitte tingimus."],
       hours:"E–N kell 22:00–06:00", place:"Objektid üle Harjumaa", start:"Oktoober",
       offers:["Masinakoolitus kohapeal","Öötöö lisatasu +25%","Tolmumask ja kõrvaklapid tööandjalt"]},
    en:{desc:["You maintain floors in large retail and production spaces: scrubber, polisher, waxing.",
              "Machine training happens on site. Previous experience helps but is not required."],
       hours:"Mon–Thu 22:00–06:00", place:"Sites across Harju county", start:"October",
       offers:["On-site machine training","+25% night shift premium","Dust mask and ear defenders provided"]}},

 4:{et:{desc:["Hoiad keskuse üldalad päeva jooksul korras: põrandad, prügikastid, klaasuksed ja toidukohtade ala.",
              "Töö on nähtav ja klientide seas, seega sõbralik hoiak on oluline. Pausiruum ja istumiskohad on olemas."],
       hours:"4-tunnised vahetused, graafik 2 nädalat ette", place:"Kaubanduskeskus, Tallinn", start:"Kohe",
       offers:["Söögisoodustus keskuses","Istumispaus iga 2 tunni järel","Vahetuse pikkuse saab valida"]},
    en:{desc:["You keep the centre's common areas in order through the day: floors, bins, glass doors and the food court.",
              "The work is visible and among customers, so a friendly manner matters. There is a break room with seating."],
       hours:"4-hour shifts, rota published 2 weeks ahead", place:"Shopping centre, Tallinn", start:"Immediately",
       offers:["Meal discount in the centre","A seated break every 2 hours","You can choose your shift length"]}},

 5:{et:{desc:["Laadid ja tühjendad tööstuslikke pesumasinaid, sorteerid ja pakid hotellide voodipesu.",
              "Enamik tööst käib ühe laua taga istudes või seistes, raskemate koormate juures aitab tõstuk."],
       hours:"E–R kell 7:00–15:30", place:"Peetri, Rae vald", start:"Kokkuleppel",
       offers:["Täiskoormus ja kindel graafik","Tasuta transport Tallinnast","Soe lõuna kohapeal"]},
    en:{desc:["You load and unload industrial washing machines, then sort and pack hotel linen.",
              "Most of the work happens at one table, sitting or standing; a lift handles the heavier loads."],
       hours:"Mon–Fri 7:00–15:30", place:"Peetri, Rae municipality", start:"By agreement",
       offers:["Full-time with a fixed schedule","Free transport from Tallinn","Hot lunch on site"]}},

 6:{et:{desc:["Valmistad hotellitoad külaliste vahetuseks ette: voodipesu, vannituba, miniköök.",
              "Tubade arv vahetuses lepitakse ette kokku, see ei ole lõputu nimekiri."],
       hours:"L ja P kell 9:00–15:00", place:"Tallinna vanalinn", start:"Novembrist",
       offers:["Nädalavahetuse lisatasu","Hommikusöök vahetuse alguses","Vormiriietus tööandjalt"]},
    en:{desc:["You prepare hotel rooms between guests: bed linen, bathroom, kitchenette.",
              "The number of rooms per shift is agreed in advance, not an open-ended list."],
       hours:"Sat and Sun 9:00–15:00", place:"Tallinn Old Town", start:"From November",
       offers:["Weekend premium","Breakfast at the start of your shift","Uniform provided"]}},

 7:{et:{desc:["Pesed kortermajade ja väikeäride aknaid esimesel ja teisel korrusel. Kõrgtööd ei ole.",
              "Objektide vahel sõidad tööandja autoga. Juhiluba ei ole nõutud — autos on alati paariline."],
       hours:"E–R kell 8:00–16:00", place:"Mustamäe ja Õismäe", start:"Kokkuleppel",
       offers:["Lõhnavabad pesuained","Paaristöö, mitte üksinda","Suvekuudel lisatunnid soovi korral"]},
    en:{desc:["You clean windows on the first and second floors of apartment buildings and small businesses. No work at height.",
              "You travel between sites in the company car. No driving licence needed — there is always a second person."],
       hours:"Mon–Fri 8:00–16:00", place:"Mustamäe and Õismäe", start:"By agreement",
       offers:["Fragrance-free products","You work in a pair, never alone","Extra hours in summer if you want them"]}},

 8:{et:{desc:["Puhastad toidutootmise seadmeid ja ruume pärast tootmisvahetuse lõppu.",
              "Toiduohutuse koolituse teeb tööandja esimesel nädalal, varasem kogemus ei ole vajalik."],
       hours:"E–R kell 17:00–01:00", place:"Jüri, Rae vald", start:"Kohe",
       offers:["Koolitus ja tervisetõend tööandja kulul","Õhtuse vahetuse lisatasu","Tööbuss Tallinnast"]},
    en:{desc:["You clean food production equipment and rooms after the production shift ends.",
              "Food safety training is provided in your first week; no previous experience needed."],
       hours:"Mon–Fri 17:00–01:00", place:"Jüri, Rae municipality", start:"Immediately",
       offers:["Training and health certificate paid for","Evening shift premium","Company bus from Tallinn"]}},

 9:{et:{desc:["Skaneerid ja sorteerid väikepakke lindi ääres. Raskeimad pakid on alla 10 kg.",
              "Töökoht on reguleeritava kõrgusega, saab vaheldumisi istuda ja seista."],
       hours:"E–R kell 7:00–11:00", place:"Lao tee, Tallinn", start:"Kohe",
       offers:["Reguleeritav töölaud ja tool","Vaikne tsoon lindi lõpus","Osalise koormuse leping"]},
    en:{desc:["You scan and sort small parcels at the belt. The heaviest parcels are under 10 kg.",
              "The workstation is height-adjustable, so you can alternate between sitting and standing."],
       hours:"Mon–Fri 7:00–11:00", place:"Lao tee, Tallinn", start:"Immediately",
       offers:["Adjustable desk and chair","A quiet zone at the end of the belt","Part-time contract"]}},

 10:{et:{desc:["Koristad riietusruumid, saunad ja saalid pärast õhtuseid treeninguid.",
               "Keskus on selleks ajaks tühi, muusika on maas ja töötempo on sinu enda määrata."],
        hours:"E, K, R ja L kell 18:00–21:00", place:"Sõle tänav, Tallinn", start:"Kokkuleppel",
        offers:["Tasuta jõusaali kasutus","Bussipeatus maja ees","Lõhnavabad puhastusvahendid"]},
     en:{desc:["You clean the changing rooms, saunas and halls after the evening training sessions.",
               "The centre is empty by then, the music is off and you set your own pace."],
        hours:"Mon, Wed, Fri and Sat 18:00–21:00", place:"Sõle street, Tallinn", start:"By agreement",
        offers:["Free use of the gym","Bus stop right outside","Fragrance-free products"]}},

 11:{et:{desc:["Hooldad nelja kortermaja trepikodasid: põrandad, käsipuud, postkastide ala ja lift.",
               "Marsruudi järjekorra ja tempo määrad ise — oluline on, et iga maja saaks nädalas kaks korda korda."],
        hours:"2 korda nädalas, kellaaeg sinu valida", place:"Kristiine, Tallinn", start:"Kohe",
        offers:["Vaba graafik nädala sees","Vahendid hoiul majas kohapeal","Istumispausid, kiirustamist ei ole"]},
     en:{desc:["You look after the stairwells of four apartment buildings: floors, handrails, the mailbox area and the lift.",
               "You decide the order and the pace — what matters is that each building is done twice a week."],
        hours:"Twice a week, time of day is yours", place:"Kristiine, Tallinn", start:"Immediately",
        offers:["Flexible schedule during the week","Equipment stored on site","Seated breaks, no rushing"]}},

 12:{et:{desc:["Koristad kuuekorruselise ärimaja kontoreid ja ühisalasid pärast tööpäeva lõppu.",
               "Majas on lift ja astmeteta sissepääs, koristusvankrit ei pea trepist tassima."],
        hours:"E–R kell 17:00–21:00", place:"Riia tänav, Tartu", start:"Kokkuleppel",
        offers:["Transpordihüvitis väljastpoolt Tartut","Lõhnavabad ja pehmetoimelised vahendid","Võimalus kasvada objektijuhiks"]},
     en:{desc:["You clean the offices and shared areas of a six-storey business building after the working day.",
               "The building has a lift and step-free entry, so the trolley never goes up stairs."],
        hours:"Mon–Fri 17:00–21:00", place:"Riia street, Tartu", start:"By agreement",
        offers:["Travel allowance from outside Tartu","Fragrance-free, mild products","A route to site supervisor"]}},

 13:{et:{desc:["Koristad kinosaalid seansside vahel: popkorn, topsid, istmete read.",
               "Vahetus on lühike ja selge — kui saalid on puhtad, oled vaba."],
        hours:"2–3 õhtut nädalas, 19:00–23:00", place:"Kesklinn, Tallinn", start:"Kohe",
        offers:["Tasuta kinopiletid","Lühikesed vahetused","Vaikne töökeskkond seansside ajal"]},
     en:{desc:["You clean the auditoriums between screenings: popcorn, cups, rows of seats.",
               "The shift is short and clear — once the halls are clean, you are done."],
        hours:"2–3 evenings a week, 19:00–23:00", place:"City centre, Tallinn", start:"Immediately",
        offers:["Free cinema tickets","Short shifts","A quiet environment during screenings"]}},

 14:{et:{desc:["Hoiad hoolekandekeskuse koridorid, söögisaali ja ühisruumid korras. Elanike tubadesse sa ei sisene.",
               "Maja tempo on rahulik ja töö käib kindla päevakava järgi."],
        hours:"E–R kell 8:00–12:00 või 16:00–20:00", place:"Lehola, Harjumaa", start:"Pärast taustakontrolli",
        offers:["Rahulik keskkond ja püsiv tiim","Istumispausid personaliruumis","Lõhnavabad vahendid elanike tõttu"]},
     en:{desc:["You keep the care home's corridors, dining hall and shared rooms in order. You never enter residents' rooms.",
               "The pace of the house is calm and the work follows a fixed daily routine."],
        hours:"Mon–Fri 8:00–12:00 or 16:00–20:00", place:"Lehola, Harju county", start:"After a background check",
        offers:["A calm environment and a settled team","Seated breaks in the staff room","Fragrance-free products for residents"]}},

 15:{et:{desc:["Poleerid ja hooldad kivi- ja vinüülpõrandaid büroohoonetes õhtusel ajal.",
               "Masina väljaõpe käib esimesel kahel õhtul koos juhendajaga."],
        hours:"T ja N kell 18:00–22:00", place:"Tallinn ja Harjumaa", start:"Kokkuleppel",
        offers:["Valiku kõrgeim tunnitasu","Väljaõpe on tasustatud","Tolmumask ja kõrvaklapid komplektis"]},
     en:{desc:["You polish and maintain stone and vinyl floors in office buildings in the evenings.",
               "Machine training runs over your first two evenings alongside a supervisor."],
        hours:"Tue and Thu 18:00–22:00", place:"Tallinn and Harju county", start:"By agreement",
        offers:["The highest hourly pay on offer here","Training is paid","Dust mask and ear defenders included"]}}
};

/* ------------------------------------------------------------------ */
/* Kasutaja CV — prototüübi näidisandmed                               */
/* ------------------------------------------------------------------ */
var CV = {
  name:"Kadri Lepik",
  phone:"+372 5512 3487",
  email:"kadri.lepik@näide.ee",
  city:"Tallinn, Kristiine",
  et:{
    summary:"Kogenud koristaja, kes otsib õhtust osalise koormusega tööd. Töötan hoolikalt ja iseseisvalt, olen harjunud kindla kontrollnimekirja järgi töötama.",
    availability:"Saadaval E, K, R õhtuti alates kella 17:00. Saan alustada kahe nädala jooksul.",
    conditions:"Tõstan kuni 10 kg. Vajan astmeteta ligipääsu. Eelistan madala müratasemega keskkonda.",
    exp:[
      {role:"Koristaja", org:"Büroohaldus OÜ", period:"2023–2026",
       text:"Kolme kontorihoone õhtune koristus, 4 tundi vahetuses. Vastutasin oma objektide varude tellimise eest."},
      {role:"Abitööline", org:"Hansa Pesumaja", period:"2021–2023",
       text:"Voodipesu sorteerimine ja pakkimine, tööstuslike masinate laadimine."}
    ],
    skills:["Ärikliendi koristus","Põrandate poleerimine","Puhastusainete ohutu käsitsemine","Eesti ja vene keel"]
  },
  en:{
    summary:"Experienced cleaner looking for part-time evening work. I work carefully and independently, and I'm used to following a fixed checklist.",
    availability:"Available Mon, Wed, Fri evenings from 17:00. I can start within two weeks.",
    conditions:"I lift up to 10 kg. I need step-free access. I prefer a low-noise environment.",
    exp:[
      {role:"Cleaner", org:"Büroohaldus OÜ", period:"2023–2026",
       text:"Evening cleaning of three office buildings, 4-hour shifts. Responsible for ordering supplies for my own sites."},
      {role:"Assistant", org:"Hansa Pesumaja", period:"2021–2023",
       text:"Sorting and packing linen, loading industrial machines."}
    ],
    skills:["Commercial cleaning","Floor buffing","Safe handling of cleaning agents","Estonian and Russian"]
  }
};
