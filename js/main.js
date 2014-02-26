// DOM elements - HUD

function makeInventoryButton() {
    var button = $('<button id="inventory-button">Inventory</button>');
    button.click(function() {
        showInventory();
    });
    return button;
}
var inventoryShown = false;

function makeTravelButton() {
    return $('<button id="travel-button">Travel to Next City</button>');
}

function makeResumeTravelButton() {
    var button = $('<button>Continue</button>');
    button.click(function() {
        resumeTravel();
    });
    return button;
}

function makeBackButton() {
    var button = $('<button class="back-button">Back</button>');
    button.click(function() {
        goBack();
    });
    return button;
}
// navigation variables
var lastScreen = [];
// game variables
var STARTING_MONEY = 6000;
var TRAVEL_TIME_INTERVAL = 2000;
var helpShown = false;
var goingHome = false;
var party = [];
var city = 'changan';
var money = STARTING_MONEY;
var distance = 0;
var totalDistance = 0;
var day = 1;
var destination;
var timer;
var karma = 1;
var animalsFed = 10;
var partyFed = 10;
// log
var log = [];
// preload assets
var imgsAllLoaded = false;
var audioAllLoaded = false;
var totalAudio;
var audioLoaded = 0;
var totalImgs = 0;
var imgsLoaded = 0;
$.getJSON("http://romgame.us.to/img/img_list.php", function(data) {
    preloadImgs(data);
});

function preloadImgs(jsonList) {
    // first check total number of images
    $.each(jsonList, function(key, val) {
        totalImgs += jsonList[key].length;
    });
    // then load the images
    var img; // stores dummy DOM element for preloading
    $.each(jsonList, function(key, val) {
        for (var i in val) {
            img = new Image(); // dummy DOM element for preloading
            img.src = "img/" + key + "/" + val[i];
            img.onload = finishedLoadingImg;
        }
    });
}

function finishedLoadingImg() {
    imgsLoaded += 1;
    if (imgsLoaded >= totalImgs) {
        imgsAllLoaded = true;
        finishedLoadingAll();
    }
}
$.getJSON("http://romgame.us.to/music/music_list.php", function(data) {
    preloadAudio(data);
});

function preloadAudio(jsonList) {
    totalAudio = jsonList.length;
    var audio; // dummy DOM element for preloading
    $.each(jsonList, function(key, val) {
        audio = new Audio();
        audio.src = "music/" + val;
        audio.oncanplaythrough = finishedLoadingAudio;
    });
}

function finishedLoadingAudio() {
    audioLoaded += 1;
    if (audioLoaded >= totalAudio) {
        audioAllLoaded = true;
        finishedLoadingAll();
    }
}

function finishedLoadingAll() {
    if (imgsAllLoaded && audioAllLoaded) {
        setup();
        start();
    }
}
// Game objects
var goods = [];
var supplies = [];
var livestock = [];
var cities = {};
var events = {};
var questions = [];

function setup() {
    // generate supplies
    // name - number - price - origin - unit
    supplies.push(new Item('Dry Food', 0, 10, null, 'bag(s)'));
    supplies.push(new Item('Animal Feed', 0, 5, null, 'bag(s)'));
    supplies.push(new Item('Medicine', 0, 50, null, 'package(s)'));
    // load up goods
    // name - number - price - origin - unit - image url - description
    goods.push(new Item('Vase', 0, 100, 'changan', '', 'img/items/vase.jpg', 'Antique vase from the Han Dynasty.'));
    goods.push(new Item('Silk', 0, 250, 'changan', 'bolt(s)', 'img/items/silk.jpg', 'Bolts of silk were also used as currency in the Tang Empire, along with coins and grain.'));
    goods.push(new Item('Wine', 0, 300, 'liangzhou', 'flask(s)', 'img/items/wine.jpg', 'Most alcohol in the Tang Empire was made from rice, but Liangzhou wine was considered very high quality and was drunk on special occasions.'));
    goods.push(new Item('Bodhisattva Statue', 0, 60, 'dunhuang', '', 'img/items/bodhisattva.jpg', 'This is an 11-Headed Guanyin. Bodhisattvas have attained Enlightenment but decided to postpone their own Nirvana in order to help others become enlightened.'));
    goods.push(new Item('Buddhist Sutra', 0, 30, 'dunhuang', 'volume(s)', 'img/items/dummy.png', 'i.e. a Buddhist text. In the early 20th century, a large number of manuscripts were discovered in a sealed cave in a Dunhuang monastery.'));
    goods.push(new Item('Resin', 0, 20, 'hami', 'bottle(s)', 'img/items/dummy.png', 'The Tang liked to perfume everything from themselves to entire mansions.'));
    goods.push(new Item('Hami Melon', 0, 20, 'hami', '', 'img/items/hami.jpg', 'Famously sweet melons that originated in Hami. They taste somewhere in between a honeydew and a cantaloupe.'));
    goods.push(new Item('Embroidered Carpet', 0, 70, 'turfan', '', 'img/items/carpet.jpg', 'Woolen rugs were often sent as gifts from Central Asian states to the Tang court.'));
    goods.push(new Item('Silverware', 0, 100, 'turfan', 'piece(s)', 'img/items/silver.jpg', 'Brought in from the Sassanian Empire, which was much further west on the Silk Road. Merchants did not travel the length of the entire route. Rather, goods travelled from one end to another like in a relay.'));
    // livestock
    // name - number - price - image url - description
    livestock.push(new Item('Horse', 0, 1000, null, ''));
    livestock.push(new Item('Camel', 0, 2000, null, ''));
    // initialize cities
    // short name - long name - population - description - map - bg img url - distance from origin
    cities["changan"] = new City("changan", "Chang'an", "1 000 000", "The bustling, cosmopolitan capital of the Tang Empire.", new Map('img/towns/changan_street.png'), 'img/towns/changan_street.png', 0);
    cities["liangzhou"] = new City("liangzhou", "Liangzhou", "???", "An exotic frontier town.", new Map('img/towns/liangzhou_street.png'), 'img/towns/liangzhou_street.png', 3030);
    cities["dunhuang"] = new City("dunhuang", "Dunhuang", "???", "A major stop on the Silk Road known for its Buddhist monasteries.", new Map('img/towns/dunhuang_street.png'), 'img/towns/dunhuang_street.png', 5300);
    cities["hami"] = new City("hami", "Hami", "???", "The first major stop outside of Tang territory.", new Map('img/towns/hami_street.png'), 'img/towns/hami_street.png', 6240);
    cities["turfan"] = new City("turfan", "Turfan", "???", "You made it! Now to go all the way back home...", new Map('img/towns/turfan_street.png'), 'img/towns/turfan_street.png', 7320);
    // load the maps with places to visit
    // Shops: name - type - city - shopkeeper img url - x on map - y on map
    // Monuments: name - description - bg img url - x on map - y on map
    cities["changan"].map.places.push(new Store("Supply Store", "supplies", "changan", 'img/people/chinese_shopkeeper.png', 525, 100));
    cities["changan"].map.places.push(new Store("Goods", "goods", "changan", 'img/people/chinese_shopkeeper.png', 210, 390));
    cities["changan"].map.places.push(new Store("Trading Post", "selling", "changan", 'img/people/chinese_shopkeeper.png', 25, 400));
    cities["changan"].map.places.push(new Store("Livestock", "livestock", "changan", 'img/people/chinese_shopkeeper.png', 500, 400));
    cities["changan"].map.places.push(new Monument("Imperial Palace", "The imposing palace of the Tang Emperor. It is laid out symmetrically to signify balance. This is just the first gate--as if they'd let commoners in!", 'img/towns/changan_palace.png', 300, 500));
    cities["liangzhou"].map.places.push(new Store("Supply Store", "supplies", "liangzhou", 'img/people/chinese_shopkeeper.png', 20, 433));
    cities["liangzhou"].map.places.push(new Store("Goods", "goods", "liangzhou", 'img/people/chinese_shopkeeper.png', 488, 421));
    cities["liangzhou"].map.places.push(new Store("Trading Post", "selling", "liangzhou", 'img/people/chinese_shopkeeper.png', 649, 300));
    cities["liangzhou"].map.places.push(new Store("Livestock", "livestock", "liangzhou", 'img/people/chinese_shopkeeper.png', 250, 400));
    cities["dunhuang"].map.places.push(new Store("Supply Store", "supplies", "dunhuang", 'img/people/chinese_shopkeeper.png', 634, 300));
    cities["dunhuang"].map.places.push(new Store("Goods", "goods", "dunhuang", 'img/people/chinese_shopkeeper.png', 500, 380));
    cities["dunhuang"].map.places.push(new Store("Trading Post", "selling", "dunhuang", 'img/people/chinese_shopkeeper.png', 630, 100));
    cities["dunhuang"].map.places.push(new Store("Livestock", "livestock", "dunhuang", 'img/people/chinese_shopkeeper.png', 9, 421));
    cities["dunhuang"].map.places.push(new Monument("Buddhist Cave", "One of the famed cave temples of Dunhuang.", 'img/towns/dunhuang_cave.png', 300, 500));
    cities["hami"].map.places.push(new Store("Supply Store", "supplies", "hami", 'img/people/sogdian_shopkeeper.png', 12, 439));
    cities["hami"].map.places.push(new Store("Goods", "goods", "hami", 'img/people/sogdian_shopkeeper.png', 191, 410));
    cities["hami"].map.places.push(new Store("Trading Post", "selling", "hami", 'img/people/sogdian_shopkeeper.png', 600, 406));
    cities["hami"].map.places.push(new Store("Livestock", "livestock", "hami", 'img/people/sogdian_shopkeeper.png', 430, 420));
    cities["turfan"].map.places.push(new Store("Supply Store", "supplies", "turfan", 'img/people/sogdian_shopkeeper.png', 12, 440));
    cities["turfan"].map.places.push(new Store("Goods", "goods", "turfan", 'img/people/sogdian_shopkeeper.png', 224, 429));
    cities["turfan"].map.places.push(new Store("Trading Post", "selling", "turfan", 'img/people/sogdian_shopkeeper.png', 20, 150));
    cities["turfan"].map.places.push(new Store("Livestock", "livestock", "turfan", 'img/people/sogdian_shopkeeper.png', 576, 408));
    cities["turfan"].map.places.push(new Monument("Grape Valley", "A lush grape farm. The air is sweet.", 'img/towns/turfan_grapevalley.png', 300, 500));
    // events
    // random number generating function
    events["personSick"] = new Event(function() {
        return Math.round(50 / (window['partyFed'] * karma))
    }, null, null);
    events["personDead"] = new Event(function() {
        return Math.round(50 / (window['partyFed'] * karma))
    }, null, null);
    events["horseDead"] = new Event(function() {
        return Math.round(100 / (window['animalsFed'] * karma))
    }, null, null);
    events["shortcut"] = new Event(function() {
        return 5
    }, null, null);
    events["quiz"] = new Event(function() {
        return 5
    }, null, null);
    events["charity"] = new Event(function() {
        return 5
    }, null, null);
    events["poem"] = new Event(function() {
        return 5
    }, null, null);
    events["xiyouji"] = new Event(function() {
        return 1
    }, null, null);
    events["coins"] = new Event(function() {
        return karma
    }, null, null);
    events["coins"].func = function() {
        money += 500;
        var person = getPeople("alive")[Math.floor(Math.random() * getPeople("alive").length)]
        log.push({
            date: day,
            action: person.firstName + " found 500 coins."
        });
        pauseTravel();
        var p = $('<p>' + person.firstName + " saw something shiny at the side of the road and stopped the entire caravan to take a look. Everyone was annoyed at them... but it turned out to be money! You found 500 coins." + '</p>');
        showNotice(p, makeResumeTravelButton());
    }
    events["xiyouji"].func = function() {
        log.push({
            date: day,
            action: "Met some odd travelers."
        });
        pauseTravel();
        var p = $('<p>' + "You come across an odd group of travelers: a monk, a monkey, a pig, and a friar. They say they're going much farther West than you to look for scriptures. You wish them luck and part ways." + '</p>');
        showNotice(p, makeResumeTravelButton());
    }
    events["poem"].func = function() {
        var person = getPeople("alive")[Math.floor(Math.random() * getPeople("alive").length)];
        log.push({
            date: day,
            action: person.firstName + " wrote a poem."
        });
        pauseTravel();
        var p = $('<p>' + person.firstName + " was so moved by the beauty of the scenery they wrote a poem! Everyone applauds and agrees that it rivals the works of Li Bai." + '</p>');
        showNotice(p, makeResumeTravelButton());
    }
    events["personSick"].func = function() {
        if (getPeople("hungry_not_sick").length > 0) {
            pauseTravel();
            var target = getPeople("hungry_not_sick")[Math.floor(Math.random() * getPeople("hungry_not_sick").length)];
            var text;
            if (getItem(supplies, "Medicine").number > 0) {
                getItem(supplies, "Medicine").number -= 1;
                text = target.firstName + " fell ill. Luckily, you had some medicine and they recovered.";
            } else {
                target.sick = true;
                $("#person-" + target.firstName).append('<div class="sick-cloud">');
                text = target.firstName + " fell ill. Hang in there!";
            }
            log.push({
                date: day,
                action: text
            });
            var p = $('<p>' + text + '</p>');
            showNotice(p, makeResumeTravelButton());
        }
    }
    events["personDead"].func = function() {
        if (getPeople("sick_not_dead").length > 0) {
            pauseTravel();
            var target = getPeople("sick_not_dead")[Math.floor(Math.random() * getPeople("sick_not_dead").length)];
            target.alive = false;
            log.push({
                date: day,
                action: target.firstName + " died."
            });
            var p = $('<p>' + target.firstName + " has died. The Silk Road is a long and arduous journey. Perhaps you'll meet again in your next lives... hopefully you have been building up your karma." + '</p>');
            var button = $('<button>Continue</button>');
            if (getPeople("alive").length > 0) {
                button.click(resumeTravel);
            } else {
                button.click(showGameOver);
            }
            showNotice(p, button);
        }
    }
    events["horseDead"].func = function() {
        var horses = getItem(livestock, "Horse");
        if (horses.number > 0) {
            horses.number -= 1;
            log.push({
                date: day,
                action: "Lost a horse."
            });
            pauseTravel();
            if (getTotalItems(livestock) <= 0) $('#animal-hunger').hide();
            var p = $("<p>One of your horses has died! It's the sort of thing that happens when you make an animal cross a large, dry desert with no food.</p>");
            if (getTotalItems(livestock) <= 0) {
                p.append(" Now you can't carry anything because you don't have any animals left! Hopefully, you have enough money to buy an animal at the next town!");
            }
            // if the user has more items than the # of horses will let them carry
            if (getTotalItems(goods) > getTotalItems(livestock) * 3) {
                // sort items by price, ditch the ones worth the least at the moment
                var sortedByPrice = []
                for (var i in goods) {
                    if (goods[i].number > 0) {
                        sortedByPrice.push(goods[i]);
                    }
                }
                sortedByPrice.sort(function(a, b) {
                    return (a.price * getPremium(a)) - (b.price * getPremium(b))
                });
                var numLost = getTotalItems(goods) - getTotalItems(livestock) * 3;
                var lostItems = {}
                for (var i = 0; i < numLost; i++) {
                    sortedByPrice[0].number -= 1;
                    if (!lostItems[sortedByPrice[0].label]) {
                        lostItems[sortedByPrice[0].label] = 0;
                    }
                    lostItems[sortedByPrice[0].label] += 1
                    if (sortedByPrice[0].number == 0) {
                        sortedByPrice.shift();
                    }
                }
                var ul = $('<ul>');
                for (var key in lostItems) {
                    money += lostItems[key] * getItem(goods, key).price;
                    ul.append('<li>' + key + ": " + lostItems[key]);
                }
                var p2 = $("<p>You can't carry all your items, so you hastily sold the following items to a passing traveler:</p>");
            }
            if (p2) {
                showNotice(p, p2, ul, makeResumeTravelButton());
            } else {
                showNotice(p, makeResumeTravelButton());
            }
        }
    }
    events["shortcut"].func = function() {
        pauseTravel();
        var p = $("<p>Hey, it looks like there's a shortcut here! You could cut about 1000 li of travel. However, it could be dangerous... it's lonely and infested with bandits. Do you want to take the risk?</p>");
        var yesButton = $('<button>Yes</button>');
        yesButton.click((function(context) {
            return function() {
                context.goAhead()
            }
        })(this));
        var noButton = $('<button>No</button>');
        noButton.click(resumeTravel);
        showNotice(p, yesButton, noButton);
        this.goAhead = goAhead;

        function goAhead() {
            distance -= 1000;
            var b = Math.floor(Math.random() * (karma + 1));
            // if you get your stuff stolen
            if (b === 0 && getTotalItems(goods) > 0) {
                log.push({
                    date: day,
                    action: "Robbed by bandits while taking shortcut."
                });
                // sort items by price, most expensive stuff gets stolen
                var sortedByPrice = [];
                for (var i in goods) {
                    if (goods[i].number > 0) {
                        sortedByPrice.push(goods[i]);
                    }
                }
                sortedByPrice.sort(function(a, b) {
                    return (b.price * getPremium(b)) - (a.price * getPremium(a))
                });
                var lostItems = {};
                var i = 0;
                while (getTotalItems(goods) > 0 && i < 3) {
                    sortedByPrice[0].number -= 1;
                    if (!lostItems[sortedByPrice[0].label]) {
                        lostItems[sortedByPrice[0].label] = 0;
                    }
                    lostItems[sortedByPrice[0].label] += 1
                    if (sortedByPrice[0].number === 0) {
                        sortedByPrice.shift();
                    }
                    i++;
                }
                var ul = $('<ul>');
                for (var key in lostItems) {
                    ul.append('<li>' + key + ": " + lostItems[key] + '</li>');
                }
                var p = $("<p>Oh no! Your caravan was attacked by bandits! " + getPeople("alive")[Math.floor(Math.random() * getPeople("alive").length)].firstName + " made a valiant attempt to drive them off, but you lost:</p>");
                showNotice(p, ul, makeResumeTravelButton());
            } else {
                log.push({
                    date: day,
                    action: "Took a shortcut."
                });
                var p = $('<p>Phew! You made it through with no trouble.</p>');
                showNotice(p, makeResumeTravelButton());
            }
        }
    }
    events["quiz"].func = function() {
        if (questions.length > 0) {
            pauseTravel();
            var n = Math.floor(Math.random() * questions.length);
            var q = questions[n];
            //questions.splice(n, 1); // question won't be asked again
            var p = $("<p>A Sogdian traveler approaches your caravan.</p>");
            var button = $("<button>Continue</button>");
            button.click((function(q) {
                return function() {
                    q.showQuestion()
                }
            })(q));
            showNotice(p, button);
        }
    }
    events["charity"].func = function() {
        pauseTravel();
        p = $("<p>A bedraggled traveler approaches your caravan.</p>");
        var button = $("<button>Continue</button>");
        button.click((function(context) {
            return function() {
                context.show();
            }
        })(this));
        showNotice(p, button);
        var charImgSrc = "img/people/chinese_merchant.png";
        this.show = show;

        function show() {
            var p, ul, button;
            p = $('<p id="quiz-question">' + "Fellow traveler, I've been robbed by bandits! Could you spare me 200 coins so I can continue my journey?" + '</p>');
            ul = $('<ul id="quiz-answers">');
            if (money > 200) {
                li = document.createElement("li");
                button = $('<button class="quiz-answer">Yes, donate 200 coins.</button>');
                button.click((function(context) {
                    return function() {
                        context.donate(1);
                    }
                })(this));
                ul.append($('<li>').append(button));
            }
            button = $('<button class="quiz-answer">' + "Sorry, I can't give you any money." + '</button>');
            button.click((function(context) {
                return function() {
                    context.donate(0);
                }
            })(this));
            ul.append($('<li>').append(button));
            showDialogue(charImgSrc, p, ul);
        }
        this.donate = donate;

        function donate(yes) {
            var p, button;
            if (yes) {
                money -= 200;
                karma += 1;
                p = $('<p>' + "Thank you so much! May the bodhisattvas protect you!" + '</p>');
                log.push({
                    date: day,
                    action: "Met another traveler and donated some money."
                });
            } else {
                p = $('<p>' + "... I understand. Keep going on your way." + '</p>');
                log.push({
                    date: day,
                    action: "Met another traveler who was asking for money. Didn't help them."
                });
            }
            showDialogue(charImgSrc, p, makeResumeTravelButton());
        }
    }
    // quiz questions
    questions.push(new Quiz("In which dynasty was this made?", "img/quiz/quiz01.jpg", "0", "Shang", "Han", "Tang"));
    questions.push(new Quiz("In which dynasty was this made?", "img/quiz/quiz02.jpg", "1", "Shang", "Han", "Tang"));
    questions.push(new Quiz("Who is this a statue of?", "img/quiz/quiz03.jpg", "2", "Buddha", "A Monk", "Guanyin"));
}
// objects

function Item(label, number, price, origin, unit, img, description) {
    this.label = label;
    this.number = number;
    this.price = price;
    this.origin = origin;
    this.unit = unit;
    this.desc = description;
    this.img = img;
}

function Person(firstName) {
    this.firstName = firstName;
    this.alive = true;
    this.sick = false;
    this.hungry = false;
}

function Map(bgImg) {
    this.bgImg = bgImg;
    this.places = [];
    for (var i = 1; i < arguments.length; i++) {
        this.places.push(arguments[i]);
    }
}

function City(location, fullName, population, description, map, bgImg, coord) {
    this.location = location;
    this.fullName = fullName;
    this.population = population;
    this.desc = description;
    this.map = map;
    this.coord = coord;
    this.bgImg = bgImg;
    this.showIntro = showIntro;

    function showIntro() {
        city = this.location;
        $('#game').css("background-image", "url('" + bgImg + "')");
        totalDistance = 0;
        log.push({
            date: day,
            action: "Arrived in " + fullName
        });
        var div, h2, p, button;
        div = $('<div class="city-initial" id="location">');
        p = $('<p class="city-welcome-to">');
        if (!goingHome) {
            p.append("Welcome To");
        } else {
            p.append("Welcome Back To");
        }
        div.append(p);
        div.append('<h2 class="city-name">' + this.fullName + '</h2>');
        div.append('<p class="city-population">Population: ' + this.population + '</p>');
        div.append('<p class="city-desc">' + this.desc + '</p>');
        button = $('<button>Explore</button>');
        button.click((function(location) {
            return function() {
                location.showMap()
            }
        })(this));
        div.append(button);
        $('#clickable').empty();
        $('#clickable').append(makeInventoryButton());
        $('#clickable').append(div);
        if (this.location == "turfan") {
            goingHome = true;
        }
        if (!$('#music')[0]) {
            $('#game').append('<audio id="music" autoplay loop>');
        }
        $('#music')[0].pause();
        $('#music').attr("src", "music/guzheng.mp3");
        $('#music').attr("type", "audio.mpeg");
        $('#music')[0].load();
        $('#music')[0].play();
        lastScreen[0] = lastScreen[1];
        lastScreen[1] = [arguments.callee, null, this];
    }
    this.showMap = showMap;

    function showMap() {
        var div, button;
        $('#game').css("background-image", "url('" + this.map.bgImg + "')");
        div = $('<div class="city-map">');
        for (var i = 0; i < this.map.places.length; i++) {
            button = $('<button>' + this.map.places[i].label + '</button>');
            button.click((function(place) {
                return function() {
                    place.show()
                }
            })(this.map.places[i]));
            button.css("position", "absolute");
            button.css("top", this.map.places[i].y + "px");
            button.css("left", this.map.places[i].x + "px");
            div.append(button);
        }
        $('#clickable').empty();
        $('#clickable').append(makeInventoryButton());
        if (getNextCity() != null) {
            var travelButton = makeTravelButton();
            travelButton.click((function(context) {
                return function() {
                    var p = $('<p>' + "Are you sure you want to leave " + context.fullName + " for " + cities[getNextCity()].fullName + "?" + '</p>');
                    var yesButton = $('<button>Yes</button>');
                    yesButton.click(function() {
                        showTravel(cities[getNextCity()])
                    });
                    yesButton.dontRemove = true; // stops showNotice from attaching eventlistener to remove event overlay to button
                    var noButton = $('<button>No</button>');
                    showNotice(p, yesButton, noButton);
                }
            })(this));
            div.append(travelButton);
        } else {
            var button = $('<button id="finish-button">Finish Game</button>');
            button.click(function() {
                var p = $('<p>' + "Are you sure you want to finish the game and get your score? Make sure you've sold everything you can." + '</p>');
                var yesButton = $('<button>Yes</button>');
                yesButton.click(function() {
                    showScore()
                });
                yesButton.dontRemove = true; // stops showNotice from attaching eventlistener to remove event overlay to button
                var noButton = $('<button>No</button>');
                showNotice(p, yesButton, noButton);
            });
            div.append(button);
        }
        div.append('<h1 class="city-name">' + this.fullName + '</h1>');
        $('#clickable').append(div);
        if (!helpShown) showHelp(0);
        lastScreen[0] = lastScreen[1];
        lastScreen[1] = [arguments.callee, null, this];
    }
}

function Store(label, type, location, shopkeeper, x, y) {
    this.label = label;
    this.type = type;
    this.x = x;
    this.y = y;
    var stock = [];
    // make stock
    if (type != "selling") {
        for (var i = 0; i < window[type].length; i++) {
            if (window[type][i].origin == location | window[type][i].origin == null) {
                stock.push(window[type][i]);
            }
        }
    }
    this.show = show;

    function show() {
        $('#game').css("background-image", "url('" + cities[location].bgImg + "')");
        var row, cell, input, button, img, speechBubble;
        // if it's a selling place, make the stock now
        if (type == "selling") {
            stock.length = 0;
            for (var i in goods) {
                if (goods[i].number > 0 && goods[i].origin != city) {
                    stock.push(goods[i]);
                }
            }
        }
        $('#clickable').empty();
        if (stock.length > 0) {
            var storeTable = $('<table>');
            for (var i = 0; i < stock.length; i++) {
                row = $('<tr>');
                if (stock[i].img != null) {
                    cell = $('<td>');
                    img = $('<img src="' + stock[i].img + '">');
                    img.mouseover((function(item) {
                        return function() {
                            $('#speech-bubble').html(item.desc);
                        }
                    })(stock[i]));
                    img.mouseout(function() {
                        $('#speech-bubble').html("If you have any questions about an item, hover over its picture for more information.")
                    });
                    cell.append(img);
                    cell.appendTo(row);
                }
                row.append('<td>' + stock[i].label + '</td>');
                if (type == "selling") {
                    row.append('<td>' + Math.round(stock[i].price * getPremium(stock[i])) + '</td>');
                } else {
                    row.append('<td>' + stock[i].price + '</td>');
                }
                cell = $('<td>');
                button = $('<button>▼</button>');
                cell.append(button);
                input = $('<input type="text" value="0" id="' + stock[i].label + '_num" readonly>');
                cell.append(input);
                // down button
                button.click((function(input, context) {
                    return function() {
                        if (input.val() > 0) {
                            input.val(parseInt(input.val()) - 1);
                            context.updateTotal(context.type);
                        }
                    }
                })(input, this));
                button = $('<button>▲</button>');
                if (type == "selling") {
                    button.click((function(input, context, item) {
                        return function() {
                            if (parseInt(input.val()) < item.number) {
                                input.val(parseInt(input.val()) + 1);
                                context.updateTotal()
                            }
                        }
                    })(input, this, stock[i]));
                } else {
                    button.click((function(input, context, item) {
                        return function() {
                            if (context.type == "goods" && getTotalItems(goods) + context.numOfBuying() + 1 > getTotalItems(livestock) * 3) {
                                alert("You can't carry this much! If you want more space, buy more horses or camels.");
                            }
                            if ((parseInt($('#total-price').html()) + item.price) <= money && ((context.type == "goods" && getTotalItems(goods) + context.numOfBuying() + 1 <= getTotalItems(livestock) * 3) || context.type == "supplies" || context.type == "livestock")) {
                                input.val(parseInt(input.val()) + 1);
                                context.updateTotal();
                            }
                        }
                    })(input, this, stock[i]));
                }
                cell.append(button);
                cell.appendTo(row);
                row.append('<td>' + stock[i].unit + '</td>');
                row.appendTo(storeTable);
            }
            if (type == "selling") {
                row = $('<tr>');
                row.append('<td colspan="3">Total Earned</td>');
                row.append('<td id="total-earned">0</td>');
                row.appendTo(storeTable);
                row = $('<tr>');
                row.append('<td colspan="3">Total Money</td>');
                row.append('<td id="total-money">' + money + '</td>');
                row.appendTo(storeTable);
            } else {
                row = $('<tr>');
                row.append('<td colspan="3">Total Price</td>');
                row.append('<td id="total-price">0</td>');
                row.appendTo(storeTable);
                row = $('<tr>');
                row.append('<td colspan="3">Money Remaining</td>');
                row.append('<td id="money-remaining">' + money + '</td>');
                row.appendTo(storeTable);
            }
            var storeDiv = $('<div class="store">');
            storeDiv.append(storeTable);
            button = $('<button id="buy-sell">');
            if (type == "selling") {
                button.click((function(context) {
                    return function() {
                        context.sell();
                        showInventory()
                    }
                })(this));
                button.append("Sell");
            } else {
                button.click((function(context) {
                    return function() {
                        context.buy();
                        showInventory()
                    }
                })(this));
                button.append("Buy");
            }
            storeDiv.append(button);
            $('#clickable').append(storeDiv);
        } // end of if block for stock.length > 0
        $('#clickable').append(makeBackButton());
        img = $('<img src="' + shopkeeper + '" class="shop-character">');
        $('#clickable').append(img);
        speechBubble = $('<div class="speech-bubble" id="speech-bubble">');
        if (type == "supplies") {
            speechBubble.append("I recommend buying 1 bag of dry food for each person per 1000 <i>li</i> of travel as well as 1 bag of animal feed for each animal per 1000 <i>li</i> of travel.");
        } else if (type == "goods") {
            speechBubble.append("Selling fine local goods! If you have any questions about an item, hover over its picture for more information.");
        } else if (type == "livestock") {
            speechBubble.append("Each animal in your caravan can carry three packages. Camels are especially helpful in the desert--they're hardier and they can sniff out the quickest routes, saving you time.");
        } else {
            speechBubble.append("I pay more for items from distant cities. The more expensive the item, the more its price goes up as you travel.");
            if (stock.length == 0) {
                speechBubble.append(" It seems like you don't have anything from another city right now. Come back when you can show me something interesting!");
            }
        }
        $('#clickable').append(speechBubble);
        $('#clickable').append(makeInventoryButton());
        lastScreen[0] = lastScreen[1];
        lastScreen[1] = [arguments.callee, null, this];
        this.updateTotal = updateTotal;

        function updateTotal() {
            var total = 0;
            if (type == "selling") {
                for (var i in stock) {
                    total = parseInt($("[id='" + stock[i].label + "_num']").val()) * Math.round(stock[i].price * getPremium(stock[i])) + total;
                }
                $('#total-earned').html(total);
                $('#total-money').html(money + total);
            } else {
                for (var i in stock) {
                    total = parseInt($("[id='" + stock[i].label + "_num']").val()) * stock[i].price + total;
                }
                $('#total-price').html(total);
                $('#money-remaining').html(money - total);
            }
        }
        this.buy = buy;

        function buy() {
            if (money >= parseInt($('#total-price').html())) {
                money = money - parseInt($('#total-price').html());
                for (var i in stock) {
                    stock[i].number += parseInt($("[id='" + stock[i].label + "_num']").val());
                    // reset display value
                    $("[id='" + stock[i].label + "_num']").val('0')
                }
                // reset display values
                $('#total-price').html('0');
                $('#money-remaining').html(money);
            } else {
                alert("You don't have enough money!");
            }
        }
        this.numOfBuying = numOfBuying;

        function numOfBuying() {
            var total = 0;
            for (var i in stock) {
                total = parseInt($("[id='" + stock[i].label + "_num']").val()) + total;
            }
            return total;
        }
        this.sell = sell;

        function sell() {
            for (var i in stock) {
                if (stock[i].number < parseInt($("[id='" + stock[i].label + "_num']").val())) {
                    alert("You don't have this many items! Go back out to the street and re-enter to refresh the store.");
                    return;
                }
            }
            for (var i in stock) {
                stock[i].number -= parseInt($("[id='" + stock[i].label + "_num']").val());
                $("[id='" + stock[i].label + "_num']").val('0'); // reset display
            }
            money = parseInt($('#total-earned').html()) + money;
            // reset display
            $('#total-earned').html('0');
            $('#total-money').html(money);
        }
    }
}

function Monument(label, desc, img, x, y) {
    this.label = label;
    this.desc = desc;
    this.img = img;
    this.x = x;
    this.y = y;
    this.show = show;

    function show() {
        $('#clickable').empty();
        $('#game').css("background-image", "url('" + img + "')");
        $('#clickable').append('<h1 class="monument-title">' + label + '</h1>');
        $('#clickable').append('<div class="monument-description"><p>' + desc + '</p></div>');
        $('#clickable').append(makeBackButton());
        log.push({
            date: day,
            action: "Took a look at " + label + "."
        });
        lastScreen[0] = lastScreen[1];
        lastScreen[1] = [arguments.callee, null, this];
    }
}

function Event(prob, func, icon) {
    this.prob = prob;
    this.func = func;
    this.icon = icon;
}

function Quiz(question, img, correct) {
    this.question = question;
    this.img = img;
    this.correct = correct;
    this.answers = [];
    var charImgSrc = 'img/people/sogdian_shopkeeper.png';
    for (var i = 3; i < arguments.length; i++) {
        this.answers.push(arguments[i]);
    }
    this.showQuestion = showQuestion;

    function showQuestion() {
        pauseTravel();
        var p, displayImg, ul, li, button;
        p = $('<p id="quiz-question">' + "Hey, wait up! Can you spare me a moment? You look like someone from the Tang Empire... maybe you could help me identify this? I have an idea of what it is but I'm not quite sure... <b>" + this.question + "</b>" + '</p>');
        if (img != null) {
            displayImg = $('<img src="' + this.img + '">');
        }
        ul = $('<ul id="quiz-answers">');
        for (var i in this.answers) {
            button = $('<button class="quiz-answer">' + this.answers[i] + '</button>');
            button.click((function(q, i) {
                return function() {
                    q.checkAnswer(i)
                }
            })(this, i));
            ul.append($('<li>').append(button));
        }
        showDialogue(charImgSrc, p, displayImg, ul);
    }
    this.checkAnswer = checkAnswer;

    function checkAnswer(number) {
        var h3, p, button;
        if (this.correct == number) {
            log.push({
                date: day,
                action: "Met a traveler on the road and made 100 coins for answering his question!"
            });
            money += 100;
            h3 = $('<p>' + "That sounds right!" + '</p>');
            p = $('<p>' + "Thank you for your help--here's 100 coins." + '</p>');
            // do not ask question again if answered correctly
            for (var i in questions) {
                if (questions[i] == this) {
                    questions.splice(i, 1);
                    break;
                }
            }
        } else {
            log.push({
                date: day,
                action: "Met a traveler on the road."
            });
            h3 = $('<h3>' + "I'm not so sure..." + '</h3>');
            p = $('<p>' + "That doesn't sound quite right. Thank you anyway." + '</p>');
        }
        showDialogue(charImgSrc, h3, p, makeResumeTravelButton());
    }
}

function showHelp(part) {
    helpShown = true;
    var p1 = $('<p>' + "Hello there, " + party[0].firstName + ", " + party[1].firstName + ", " + party[2].firstName + ", and " + party[3].firstName + "! Welcome to Chang'an, capital of the Tang Empire." + '</p>');
    var p2 = $('<p>' + "I made millions back in my day, let me tell you, but I'm too old for the road now, harhar! I see you're a bunch of greenhorns, so let me give you some tips." + '</p>');
    var p3 = $('<p>' + "Your goal here is make as much money as you can by buying things and selling them for higher prices in different cities. The farther between the place you bought the item and the place you sell it at, the higher your profit. The more expensive the item, the more the price rises." + '</p>');
    var p4 = $('<p>' + "The first thing you're going to want to do is buy some horses or camels. See the sign that says \"Livestock\" over there? You need some animals or you won't be able to carry anything!" + '</p>');
    var p5 = $('<p>' + "Then head over to Goods to examine some local wares you can sell in other cities." + '</p>');
    var p6 = $('<p>' + "To sell something, visit the Trading Post. Of course, you won't have anything to sell at this time, because the buyers there only want goods from other cities." + '</p>');
    var p7 = $('<p>' + "Before you set off, head over to Supplies to stock up on food for your caravan. The shopkeeper will let you know how much you'll need for your journey. It's dangerous out there and many people have died on the way--so you might also want some medicine at hand." + '</p>');
    var p8 = $('<p>' + "You'll see your travel documents in the bottom right corner--they'll show your planned route, everything you're carrying, everyone in your party, and all your animals. There is also a log in case your memory's spotty, but you're not old like me, are you? Harhar!" + '</p>');
    var p9 = $('<p>' + "By the way, my brother's still on the road. If you see him, can you give him a hand? He won't be of much help to you (sigh...), but I'm sure you'll be repaid in karma." + '</p>');
    var p10 = $('<p>' + "Good luck!" + '</p>');
    var moreButton = $('<button>Continue</button>');
    moreButton.click((function(context, i) {
        return function() {
            context.showHelp(i + 1)
        }
    })(this, part));
    var contButton = $('<button>Continue</button>');
    //contButton.onclick = (function(context) { return function() {context.showMap()} })(this);
    if (part == 0) {
        showDialogue('img/people/chinese_merchant.png', p1, p2, p3, moreButton);
    } else if (part == 1) {
        showDialogue('img/people/chinese_merchant.png', p4, p5, p6, p7, moreButton);
    } else {
        showDialogue('img/people/chinese_merchant.png', p8, p9, p10, contButton);
    }
}
// helpers

function getItem(array, itemName) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].label == itemName) {
            return array[i];
        }
    }
    return -1;
}

function getTotalItems(array) {
    var total = 0;
    for (var i in array) {
        total += array[i].number;
    }
    return total;
}

function getNextCity() {
    if (!goingHome) {
        switch (city) {
        case "changan":
            return "liangzhou";
        case "liangzhou":
            return "dunhuang";
        case "dunhuang":
            return "hami";
        case "hami":
            return "turfan";
        }
    } else {
        switch (city) {
        case "turfan":
            return "hami";
        case "hami":
            return "dunhuang";
        case "dunhuang":
            return "liangzhou";
        case "liangzhou":
            return "changan";
        }
    }
    return null;
}

function getPeople(status) {
    var returnArray = new Array();
    if (status == "dead") {
        for (var i = 0; i < party.length; i++) {
            if (!party[i].alive) {
                returnArray.push(party[i]);
            }
        }
    } else if (status == "hungry_not_sick") {
        for (var i = 0; i < party.length; i++) {
            if (party[i].hungry && !party[i].sick && party[i].alive) {
                returnArray.push(party[i]);
            }
        }
    } else if (status == "sick_not_dead") {
        for (var i = 0; i < party.length; i++) {
            if (party[i].sick && party[i].alive) {
                returnArray.push(party[i]);
            }
        }
    } else {
        for (var i = 0; i < party.length; i++) {
            if (party[i][status]) {
                returnArray.push(party[i]);
            }
        }
    }
    return returnArray;
}

function showNotice() {
    var overlay = $('<div class="dark-overlay" id="event-overlay">');
    overlay.className = "dark-overlay";
    overlay.id = "event-overlay";
    var div = $('<div id="event-notice" class="event">');
    for (var i in arguments) {
        addClose(arguments[i], '#event-overlay');
        div.append(arguments[i]);
    }
    overlay.append(div);
    $('#clickable').append(overlay);
}

function showDialogue(charImg) {
    var div, speechBubble;
    div = $('<div id="quiz-bg" class="dark-overlay">');
    speechBubble = $('<div class="quiz-bubble" id="speech-bubble">');
    for (var i = 1; i < arguments.length; i++) {
        if (arguments[i] == null) {
            continue;
        }
        addClose(arguments[i], '#quiz-bg');
        speechBubble.append(arguments[i]);
    }
    div.append(speechBubble);
    div.append('<img src="' + charImg + '" class="quiz-character">');
    $('#clickable').append(div);
}

function addClose(node, selector) {
    if (!(node instanceof jQuery)) {
        node = $(node);
    }
    if (node.prop('tagName') == "BUTTON" && !node.dontRemove) {
        node.click(function() {
            $(selector).remove()
        });
    } else if (node[0].nodeType == 1 && node[0].hasChildNodes()) {
        $.each(node.children(), function(key, value) {
            addClose(value, selector)
        });
    }
}
// navigation functions

function goBack() {
    lastScreen[0][0].apply(lastScreen[0][2], lastScreen[0][1]);
}
// price calculation functions

function getPremium(item) {
    return (1 + (Math.abs(cities[city].coord - cities[item.origin].coord) / 10000));
}

function showInventory() {
    var paused = false;
    if (timer != null) {
        pauseTravel();
    }
    if (timer == null && totalDistance != 0) {
        paused = true;
    }
    var inventoryDivBg = $('<div id="inventory-bg" class="dark-overlay">');
    var inventoryDiv = $('<div id="inventory" class="inventory">');
    var colDiv, div, canvas, p, table, row, cell, th, img, pkg, animalDiv;
    colDiv = $('<div class="inventory-col">');
    colDiv.append('<table id="money"><tr><td>Money</td><td>' + money + ' coins</td></tr></table>');
    table = $('<table id="supplies" class="list-of-items"> ');
    row = $('<tr>');
    row.append('<th colspan="2">Supplies</th>');
    table.append(row);
    for (var i = 0; i < supplies.length; i++) {
        row = $('<tr>');
        row.append('<td>' + supplies[i].label + '</td>');
        cell = $('<td>');
        cell.append(supplies[i].number + " " + supplies[i].unit);
        if (supplies[i].label == "Medicine" && supplies[i].number > 0) {
            var link = $('<a href="">[Use]</a>');
            link.click(function() {
                pickMedicine();
                return false
            });
            cell.append(link);
        }
        row.append(cell);
        table.append(row);
    }
    colDiv.append(table);
    div = $('<div id="map">');
    if (totalDistance == 0 && !goingHome) {
        div.css("background-image", "url('img/map/map_at_" + city + ".png')");
    } else if (totalDistance == 0 && goingHome) {
        div.css("background-image", "url('img/map/map_at_" + city + "_back.png')");
    } else if (!goingHome) {
        div.css("background-image", "url('img/map/map_to_" + destination.location + ".png')");
    } else {
        div.css("background-image", "url('img/map/map_to_" + destination.location + "_back.png')");
    }
    colDiv.append(div);
    if (getNextCity() != null) {
        colDiv.append('<p>' + Math.abs(cities[getNextCity()].coord - cities[city].coord) + " li to " + cities[getNextCity()].fullName + '</p>');
    }
    div = $('<div id="caravan">');
    var a = 0;
    for (var c in livestock) {
        for (var i = 0; i < livestock[c].number; i++) {
            animalDiv = $('<div class="' + livestock[c].label.toLowerCase() + '">');
            if (livestock[c].label == 'Horse') {
                animalDiv.attr("id", 'horse-' + i);
            } else if (livestock[c].label == 'Camel') {
                animalDiv.attr("id", 'camel-' + i);
            }
            div.append(animalDiv);
            // calculate the packages displayed
            var n = 0;
            while (a < getTotalItems(goods) - (getTotalItems(livestock) * n)) {
                animalDiv.append('<img src="img/travel/package.png" class="package-' + n + '">');
                n++;
            }
            a++;
        }
    }
    colDiv.append(div);
    inventoryDiv.append(colDiv);
    colDiv = $('<div class="inventory-col">');
    table = $('<table id="goods" class="list-of-items">');
    row = $('<tr>');
    row.append('<th colspan="3">Goods</th>');
    table.append(row);
    for (var i = 0; i < goods.length; i++) {
        if (goods[i].number > 0) {
            row = $('<tr>');
            img = $('<img src="' + goods[i].img + '">');
            img.mouseover((function(item) {
                return function() {
                    showDetail(item)
                }
            })(goods[i]));
            img.mouseout(function() {
                $('#item-detail').remove();
            });
            row.append($('<td>').append(img));
            row.append('<td>' + goods[i].label + '</td>');
            row.append('<td>' + goods[i].number + " " + goods[i].unit + '</td>');
            table.append(row);
        }
    }
    colDiv.append(table);
    var h1 = document.createElement('h1');
    h1.innerHTML = "Party Members";
    colDiv.append('<h1>Party Members</h1>');
    var ul = $('<ul>');
    var li;
    for (var i = 0; i < party.length; i++) {
        li = $('<li>');
        li.append(party[i].firstName);
        if (!party[i].alive) {
            li.css("text-decoration", "line-through");
        } else if (party[i].sick) {
            li.append(" [ill]");
        }
        ul.append(li);
    }
    colDiv.append(ul);
    inventoryDiv.append(colDiv);
    var invBackButton = $('<button>Go back</button>');
    invBackButton.click((function(paused) {
        return function() {
            inventoryShown = false;
            $('#inventory-bg').remove();
            if (paused) {
                resumeTravel()
            }
        }
    })(paused));
    inventoryDiv.append(invBackButton);
    var logButton = $('<button>Log</button>');
    logButton.click(function() {
        $('#inventory-bg').remove();
        showLog()
    });
    inventoryDiv.append(logButton);
    inventoryDivBg.append(inventoryDiv);
    if (!inventoryShown) {
        inventoryShown = true;
        $('#clickable').append(inventoryDivBg);
    }
}

function showDetail(item) {
    $('#clickable').append('<div class="item-detail" id="item-detail"><h2>' + item.label + '</h2><img src="' + item.img + '"><p>Purchased at: ' + cities[item.origin].fullName + '<p>' + item.desc + '</p></div>');
}

function pickMedicine() {
    var medBg = $('<div class="dark-overlay" id="med-bg">');
    var div = $('<div id="event-notice" class="event">');
    var ul = $('<ul>');
    if (getPeople("sick_not_dead").length > 0) {
        div.append("<h2>Who should we give the medicine to?</h2>");
        for (var i = 0; i < getPeople("sick_not_dead").length; i++) {
            var a = $('<a href="">' + getPeople("sick_not_dead")[i].firstName + '</a>');
            a.click((function(target) {
                return function() {
                    heal(target);
                    $('#med-bg').remove();
                    $('#inventory-bg').remove();
                    inventoryShown = false;
                    showInventory();
                    return false;
                }
            })(getPeople("sick_not_dead")[i]));
            ul.append($('<li>').append(a));
        }
        div.append(ul);
    } else {
        div.append("<h2>No one needs the medicine right now!</h2>");
    }
    var medBackButton = $('<button>Go back</button>');
    medBackButton.click(function() {
        $('#med-bg').remove();
    });
    div.append(medBackButton);
    medBg.append(div);
    $('#clickable').append(medBg);
}

function heal(target) {
    target.sick = false;
    getItem(supplies, 'Medicine').number -= 1;
    log.push({
        date: day,
        action: target.firstName + " got better."
    });
}

function showLog() {
    var logBg = $('<div class="dark-overlay" id="log-bg">');
    var logDiv = $('<div class="inventory" id="log">');
    logDiv.append('<h1>Log</h1>');
    var ul = $('<ul>');
    for (var i = 0; i < log.length; i++) {
        ul.append('<li>' + "Day " + log[i].date + ": " + log[i].action);
    }
    logDiv.append(ul);
    var logBackButton = $('<button>Go back</button>');
    logBackButton.click(function() {
        $('#log-bg').remove();
        inventoryShown = false;
        showInventory()
    });
    logDiv.append(logBackButton);
    logBg.append(logDiv);
    $('#clickable').append(logBg);
}

function showEvent() {
    var oldDistance = distance;
    distance -= (100 * animalsFed) * (1 + 0.25 * (getItem(livestock, "Camel").number));
    var distanceTravelled;
    if (distance >= 0) {
        distanceTravelled = (100 * animalsFed) * (1 + 0.25 * (getItem(livestock, "Camel").number));
    } else {
        distanceTravelled = oldDistance;
    }
    day++;
    var animalFeed = getItem(supplies, "Animal Feed");
    var dryFood = getItem(supplies, "Dry Food");
    var medicine = getItem(supplies, "Medicine");
    animalFeed.number = Math.round((animalFeed.number - (distanceTravelled / 1000) * getTotalItems(livestock)) * 10) / 10;
    dryFood.number = Math.round((dryFood.number - (distanceTravelled / 1000) * getPeople("alive").length) * 10) / 10;
    if (animalFeed.number <= 0) {
        animalFeed.number = 0;
        animalsFed = 5;
    } else {
        animalsFed = 10;
    }
    if (dryFood.number <= 0) {
        for (var i = 0; i < getPeople("alive").length; i++) {
            getPeople("alive")[i].hungry = true;
        }
        dryFood.number = 0;
        partyFed = 5;
    } else {
        partyFed = 10;
        for (var i = 0; i < getPeople("alive").length; i++) {
            getPeople("alive")[i].hungry = false;
        }
    }
    $('#party-hunger').html("Party Hunger: " + getHungerStatus(partyFed));
    $('#animal-hunger').html("Animal Hunger: " + getHungerStatus(animalsFed));
    if (distance < 0) {
        timer = window.clearInterval(timer);
        timer = null;
        destination.showIntro();
        return;
    }
    $("#distance").html(distance + ' li to go');
    $("#days-left").html("Day " + day);
    if (!goingHome) {
        $("#moving").css("background-position", ((distance / totalDistance) * 100) + "% 0%");
    } else {
        $("#moving").css("background-position", (100 - (distance / totalDistance) * 100) + "% 0%");
    }
    var eventProbs = {};
    var total = -1;
    for (var key in events) {
        total += 1;
        eventProbs[key] = [];
        eventProbs[key].push(total);
        total += events[key].prob() - 1;
        eventProbs[key].push(total);
    }
    var r = Math.floor(Math.random() * 100);
    for (var key in eventProbs) {
        if (r >= eventProbs[key][0] && r <= eventProbs[key][1]) {
            events[key].func();
            break;
        }
    }
}

function pauseTravel() {
    timer = window.clearInterval(timer);
    $('[id^="horse-"]').css("background-image", "url('img/travel/horse_stand.gif')");
    $('[id^="camel-"]').css("background-image", "url('img/travel/camel_stand.gif')");
    for (var i = 0; i < getPeople("alive").length; i++) {
        $("#person-" + getPeople("alive")[i].firstName).css("background-image", "url('img/travel/person_standing.gif')");
    }
}

function resumeTravel() {
    $('#moving-caravan').remove();
    $('#moving').append(makeMovingCaravan());
    timer = window.setInterval(showEvent, TRAVEL_TIME_INTERVAL);
}

function showTravel(target) {
    destination = target;
    distance = Math.abs(destination.coord - cities[city].coord);
    totalDistance = distance;
    var animalFeed = getItem(supplies, "Animal Feed");
    var dryFood = getItem(supplies, "Dry Food");
    if (animalFeed.number > 0) {
        animalsFed = 10;
    }
    if (dryFood.number > 0) {
        partyFed = 10;
    }
    $('#game').css("background-image", "");
    $('#game').css("background-color", "black");
    $('#clickable').empty();
    $('#clickable').append('<div id="distance">' + distance + ' li to go</div>');
    $('#clickable').append('<div id="days-left">Day ' + day + '</div>');
    var movingDiv = $('<div id="moving">');
    if (!goingHome) {
        movingDiv.attr("class", "moving-to");
    } else {
        movingDiv.attr("class", "moving-reverse");
    }
    $('#clickable').append(movingDiv);
    movingDiv.append(makeMovingCaravan());
    $('#clickable').append('<div id="info"><p id="party-hunger">Party Hunger: ' + getHungerStatus(partyFed) + '</p>');
    var p = $('<p id="animal-hunger">Animal Hunger: ' + getHungerStatus(animalsFed) + '</p>');
    $('#info').append(p);
    if (getTotalItems(livestock) <= 0) p.hide();
    $('#clickable').append(makeInventoryButton());
    $('#music')[0].pause();
    $('#music').attr("src", "music/344.mp3");
    $('#music')[0].load();
    $('#music')[0].play();
    lastScreen[0] = lastScreen[1];
    lastScreen[1] = [arguments.callee, [destination]];
    timer = window.setInterval(showEvent, TRAVEL_TIME_INTERVAL);
    log.push({
        date: day,
        action: "Set off for " + destination.fullName
    });
}

function makeMovingCaravan() {
    var movingCaravanDiv = $('<div id="moving-caravan">');
    var animalDiv;
    var a = 0;
    for (var c in livestock) {
        for (var i = 0; i < livestock[c].number; i++) {
            animalDiv = $('<div class="' + livestock[c].label.toLowerCase() + '">');
            if (livestock[c].label == 'Horse') {
                animalDiv.attr("id", 'horse-' + i);
            } else if (livestock[c].label == 'Camel') {
                animalDiv.attr("id", 'camel-' + i);
            }
            movingCaravanDiv.append(animalDiv);
            // calculate the packages displayed
            var n = 0;
            while (a < getTotalItems(goods) - (getTotalItems(livestock) * n)) {
                animalDiv.append('<img src="img/travel/package.png" class="package-' + n + '">');
                n++;
            }
            a++;
        }
    }
    var personDiv;
    for (var i = 0; i < getPeople("alive").length; i++) {
        personDiv = $('<div class="person" id="person-' + getPeople("alive")[i].firstName + '">');
        movingCaravanDiv.append(personDiv);
        if (getPeople("alive")[i].sick) {
            personDiv.append('<div class="sick-cloud">');
        }
    }
    return movingCaravanDiv;
}

function getHungerStatus(num) {
    if (num >= 10) {
        return "Satisfied";
    } else if (num == 5) {
        return "Hungry";
    } else {
        return "Starving";
    }
}

function setPartyNames() {
    for (var i = 0; i < 4; i++) {
        party[i] = new Person($('#member_' + i).val(), "good");
    }
}

function showPartyNamesInput() {
    var overlay = $('<div class="dark-overlay">');
    var div = $('<div id="name-input">');
    div.append('<p>Enter the names of your party members:</p>');
    var form = $('<form>');
    form.submit(function() {
        setPartyNames();
        cities['changan'].showIntro();
        return false;
    });
    for (var i = 0; i < 4; i++) {
        form.append('<input type="text" id="member_' + i + '" required>');
        form.append('<br>');
    }
    form.append('<button type="submit">Submit Names</button>');
    div.append(form);
    overlay.append(div);
    $('#clickable').append(overlay);
    lastScreen[0] = lastScreen[1];
    lastScreen[1] = [arguments.callee, null];
}

function showGameOver() {
    $('#clickable').empty();
    $('#clickable').append('<div class="event"><h1>Game Over</h1><p>' + "Alas, everyone in your party perished before making it back to Chang'an. Hopefully, a kind passing traveler will send your bodies back to your hometowns. May you have better luck in your next lives." + '</p></div>');
}

function showScore() {
    var score = (10 * (money + getItem(livestock, "Horse").price * getItem(livestock, "Horse").number + getItem(livestock, "Camel").price * getItem(livestock, "Camel").number - STARTING_MONEY)) + 1000 * getPeople("alive").length + 1000 * (4 - getPeople("sick").length) + 1000 * (4 - getPeople("hungry").length) + 2500 * karma + 500 * (31 - day);
    $('#clickable').empty();
    var div, h1, p, img;
    overlay = $('<div class="dark-overlay">');
    div = $('<div class="end-roll" id="end-roll">');
    var ul = $('<ul>');
    for (var i = 0; i < log.length; i++) {
        ul.append('<li>Day ' + log[i].date + ": " + log[i].action);
    }
    div.append(ul);
    var letterScore;
    var comment;
    switch (true) {
    case score >= 25000:
        letterScore = "A";
        comment = "Great job! You're good at making money and keeping everyone alive!";
        break;
    case score >= 20000:
        letterScore = "B";
        comment = "Not bad! You made some money, and your party members are alive (mostly)."
        break;
    case score >= 15000:
        letterScore = "C";
        comment = "You win some, you lose some."
        break;
    case score >= 10000:
        letterScore = "D";
        comment = "No one said traveling was easy, especially over 1000 years ago! Better luck next time."
        break;
    default:
        letterScore = "F";
        comment = "You must have had <i>really</i> bad luck."
    }
    div.append('<h1>Score: ' + letterScore + '</h1><p>' + comment + '</p><p>Thank you for playing!</p>');
    var button = $('<button>Replay</button>');
    button.click(function() {
        document.location.href = document.location.href
    });
    div.append(button);
    overlay.append(div);
    $('#clickable').append(overlay);
    div.css("top", ((div.height() - 400) * -1) + "px");
}

function showIntro() {
    var div = $('<div class="event" id="introduction">');
    div.append("<p>The Tang Dynasty of China lasted roughly from 618 AD to 907 AD. That's over 1000 years ago! The height of the Tang era is remembered for its riches, both artistic and economic. Tang citizens traded ideas and goods from far and wide.</p>");
    div.append("<p>One of the most famous trade routes was the Silk Road, which ran from Chang'an, the capital of the Tang Empire, to the far west, reaching today's Turkey and Egypt.</p>");
    div.append("<p>Let's see what it was like to be a merchant in this exciting time! Can you travel to six different cities, earn lots of money... and make it all the way back?</p>");
    var button = $('<button>Let\'s go!</button>');
    button.click(function() {
        $('#introduction').remove();
        showPartyNamesInput()
    });
    div.append(button);
    $('#clickable').append(div);
}

function showTitle() {
    $('#game').css("background-image", "");
    var div = $('<div id="title-screen">');
    $('#clickable').append(div);
    div.append('<h1>Silk Road</h1>');
    var button = $('<button id="start">Start</button>');
    button.click(function() {
        this.style.visibility = "hidden";
        showIntro()
    });
    div.append(button);
    var caravanDiv = $('<div id="caravan">');
    for (var i = 0; i < 4; i++) {
        caravanDiv.append('<img src="img/travel/person_walking.gif">');
    }
    for (var i = 0; i < 3; i++) {
        caravanDiv.append('<div><img src="img/travel/horse_trot.gif"><img src="img/travel/package.png" class="package"></div>');
    }
    caravanDiv.append('<div><img src="img/travel/camel_trot.gif"><img src="img/travel/package.png" class="package"></div>');
    div.append(caravanDiv);
    lastScreen[0] = lastScreen[1];
    lastScreen[1] = [arguments.callee, null];
}

function start() {
    $('#clickable').empty();
    showTitle();
}
$(function() {
    $('#clickable').append('<div id="loading"><p>Loading...</p><img src="loading_bar.gif"></div>');
});