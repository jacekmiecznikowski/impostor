// Expanded Database with over 15 rich categories
const WORD_DATABASE = {
    jedzenie: [
        { word: "Pizza", hint: "Ser" }, { word: "Sushi", hint: "Ryż" }, { word: "Kebab", hint: "Sos" },
        { word: "Pierogi", hint: "Farsz" }, { word: "Hamburger", hint: "Bułka" }, { word: "Spaghetti", hint: "Makaron" },
        { word: "Tiramisu", hint: "Kawa" }, { word: "Pączek", hint: "Lukier" }, { word: "Rosół", hint: "Kura" }
    ],
    zwierzeta: [
        { word: "Słoń", hint: "Trąba" }, { word: "Żyrafa", hint: "Szyja" }, { word: "Pingwin", hint: "Frak" },
        { word: "Kangur", hint: "Torba" }, { word: "Koala", hint: "Eukaliptus" }, { word: "Lew", hint: "Grzywa" },
        { word: "Papuga", hint: "Pióra" }, { word: "Delfin", hint: "Fala" }, { word: "Nietoperz", hint: "Noc" }
    ],
    miejsca: [
        { word: "Paryż", hint: "Wieża" }, { word: "Plaża", hint: "Piasek" }, { word: "Góry", hint: "Śnieg" },
        { word: "Kosmos", hint: "Gwiazdy" }, { word: "Szkoła", hint: "Ławka" }, { word: "Kino", hint: "Popcorn" },
        { word: "Szpital", hint: "Lekarz" }, { word: "Pustynia", hint: "Kaktus" }, { word: "Zamek", hint: "Rycerz" }
    ],
    przedmioty: [
        { word: "Zegarek", hint: "Czas" }, { word: "Telefon", hint: "Ekran" }, { word: "Okulary", hint: "Oczy" },
        { word: "Parasol", hint: "Deszcz" }, { word: "Latarka", hint: "Światło" }, { word: "Klawiatura", hint: "Przyciski" },
        { word: "Portfel", hint: "Pieniądze" }, { word: "Poduszka", hint: "Sen" }, { word: "Nóż", hint: "Ostrze" }
    ],
    zawody: [
        { word: "Strażak", hint: "Ogień" }, { word: "Lekarz", hint: "Stetoskop" }, { word: "Pilot", hint: "Samolot" },
        { word: "Kucharz", hint: "Fartuch" }, { word: "Detektyw", hint: "Lupa" }, { word: "Sędzia", hint: "Młotek" },
        { word: "Fryzjer", hint: "Nożyczki" }, { word: "Astronauta", hint: "Kombinezon" }, { word: "Artysta", hint: "Pędzel" }
    ],
    popkultura: [
        { word: "Harry Potter", hint: "Różdżka" }, { word: "Batman", hint: "Maska" }, { word: "Star Wars", hint: "Miecz" },
        { word: "Minecraft", hint: "Kostka" }, { word: "Super Mario", hint: "Grzybek" }, { word: "Spider-Man", hint: "Sieć" },
        { word: "Titanic", hint: "Góra lodowa" }, { word: "Matrix", hint: "Pigułka" }, { word: "Shrek", hint: "Bagno" }
    ],
    technologia: [
        { word: "Smartfon", hint: "Dotyk" }, { word: "Dron", hint: "Śmigła" }, { word: "Komputer", hint: "Procesor" },
        { word: "Sztuczna Inteligencja", hint: "Algorytm" }, { word: "Robot", hint: "Metal" }, { word: "Konsola", hint: "Pad" }
    ],
    sport: [
        { word: "Piłka nożna", hint: "Bramka" }, { word: "Koszykówka", hint: "Kosz" }, { word: "Tenis", hint: "Rakieta" },
        { word: "Pływanie", hint: "Basen" }, { word: "Siatkówka", hint: "Siatka" }, { word: "Boks", hint: "Rękawice" }
    ],
    muzyka: [
        { word: "Gitara", hint: "Struny" }, { word: "Pianino", hint: "Klawisze" }, { word: "Perkusja", hint: "Pałeczki" },
        { word: "Mikrofon", hint: "Głos" }, { word: "Koncert", hint: "Tłum" }, { word: "Słuchawki", hint: "Uszy" }
    ],
    historia: [
        { word: "Piramidy", hint: "Faraon" }, { word: "Koloseum", hint: "Gladiator" }, { word: "Rycerz", hint: "Zbroja" },
        { word: "Wiking", hint: "Topór" }, { word: "Król", hint: "Korona" }, { word: "Zamek", hint: "Fosa" }
    ],
    fantasy: [
        { word: "Smok", hint: "Ogień" }, { word: "Elf", hint: "Łuk" }, { word: "Mag", hint: "Różdżka" },
        { word: "Jednorożec", hint: "Róg" }, { word: "Zombiak", hint: "Mózg" }, { word: "Wampir", hint: "Kły" }
    ],
    nauka: [
        { word: "Mikroskop", hint: "Szkiełko" }, { word: "DNA", hint: "Geny" }, { word: "Atom", hint: "Elektron" },
        { word: "Teleskop", hint: "Gwiazdy" }, { word: "Laboratorium", hint: "Flesz" }, { word: "Magnes", hint: "Biegun" }
    ],
    motoryzacja: [
        { word: "Kabriolet", hint: "Brak dachu" }, { word: "Motocykl", hint: "Dwa koła" }, { word: "Tiry", hint: "Naczepa" },
        { word: "Helikopter", hint: "Śmigło" }, { word: "Pociąg", hint: "Tory" }, { word: "Formula 1", hint: "Tor" }
    ],
    podroze: [
        { word: "Walizka", hint: "Kółka" }, { word: "Paszport", hint: "Wiza" }, { word: "Namiot", hint: "Szpilki" },
        { word: "Mapa", hint: "Kompas" }, { word: "Samolot", hint: "Skrzydła" }, { word: "Plecak", hint: "Ramiona" }
    ],
    kosmos: [
        { word: "Czarna dziura", hint: "Grawitacja" }, { word: "Mars", hint: "Czerwona planeta" }, { word: "Astronauta", hint: "Kombinezon" },
        { word: "Kometa", hint: "Warkocz" }, { word: "Satelita", hint: "Orbita" }, { word: "Grawitacja", hint: "Spadek" }
    ],
    natura: [
        { word: "Wodospad", hint: "Spadająca woda" }, { word: "Wulkan", hint: "Lawa" }, { word: "Tęcza", hint: "Kolory" },
        { word: "Błyskawica", hint: "Burza" }, { word: "Jaskinia", hint: "Stalaktyt" }, { word: "Las", hint: "Drzewa" }
    ]
};

const CATEGORY_NAMES = {
    jedzenie: { name: "Jedzenie", icon: "fa-burger", desc: "Potrawy i przysmaki" },
    zwierzeta: { name: "Zwierzęta", icon: "fa-paw", desc: "Fauna z całego świata" },
    miejsca: { name: "Miejsca", icon: "fa-earth-americas", desc: "Lokacje i punkty" },
    przedmioty: { name: "Przedmioty", icon: "fa-box-archive", desc: "Rzeczy codziennego użytku" },
    zawody: { name: "Zawody", icon: "fa-briefcase", desc: "Profesje i rzemiosła" },
    popkultura: { name: "Popkultura", icon: "fa-film", desc: "Filmy, gry i ikony" },
    technologia: { name: "Technologia", icon: "fa-microchip", desc: "Gadżety i cyfrowy świat" },
    sport: { name: "Sport", icon: "fa-futbol", desc: "Dyscypliny i aktywność" },
    muzyka: { name: "Muzyka", icon: "fa-music", desc: "Instrumenty i dźwięki" },
    historia: { name: "Historia", icon: "fa-landmark", desc: "Epoki i artefakty" },
    fantasy: { name: "Fantasy", icon: "fa-dragon", desc: "Mityczne stworzenia" },
    nauka: { name: "Nauka", icon: "fa-atom", desc: "Odkrycia i laboratoria" },
    motoryzacja: { name: "Motoryzacja", icon: "fa-car", desc: "Pojazdy i transport" },
    podroze: { name: "Podróże", icon: "fa-plane-departure", desc: "Wyprawy i ekwipunek" },
    kosmos: { name: "Kosmos", icon: "fa-rocket", desc: "Galaktyka i gwiazdy" },
    natura: { name: "Natura", icon: "fa-tree", desc: "Żywioły i krajobrazy" }
};

const DISCUSSION_TIPS = [
    "Zaczynajcie od ogólnych pytań, aby nie ułatwić zadania impostorowi.",
    "Obserwuj, kto odpowiada wymijająco lub zbyt długo szuka słów.",
    "Impostor często powtarza motywy z poprzednich wypowiedzi innych.",
    "Zadawaj pytania wprost do konkretnych osób, by sprawdzić ich pewność siebie.",
    "Pamiętaj: podpowiedź dla impostora bywa bardzo zwodnicza!"
];
