
let QS = require("./qs");
let parser = require("../parser/parser");

let qss = [
    "true",
    "rojo&naranja&amarillo&verde&azul",
    "username=user1&password=password&config.theme=light&config.lang=en",
    "users=user1&users=user2&users=user3"
];
let tests = [
    true,
    {
        date: new Date(),
        regex: /.*/,
        user: {
            name: "user1",
            config: {
                langs: ["en", "de"],
                font: "monospace"
            }
        }
    },
    [1, 2, 3, 4],
    {
        font: "monospace",
        color: "white",
        background: "black"
    }
];



qss.forEach(function (qs) {
    console.log(QS.parse(qs));
});
tests.forEach(function (test) {
    console.log(QS.stringify(parser.stringifyToSO(test)));
});


