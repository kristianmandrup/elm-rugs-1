import {Project} from "@atomist/rug/model/Project";
import {
    Given, ProjectScenarioWorld, Then, When,
} from "@atomist/rug/test/project/Core";
import {ElmProgram} from "../../editors/elm/ElmProgram";
import * as Elm from "../../editors/elm/ElmProgram";

const CERTAIN_INPUT_FILEPATH = "src/Main.elm";

const CERTAIN_FILE_CONTENT_BEFORE = `module Main exposing (main)


-- MESSAGES


type Msg
    = NoOp


-- UPDATE


update : Msg -> Model -> Model
update msg model =
    case msg of
        NoOp ->
            model
`;

const CERTAIN_FILE_CONTENT_AFTER = `module Main exposing (main)


-- MESSAGES


type Msg
    = NoOp
    | Banana String


-- UPDATE


update : Msg -> Model -> Model
update msg model =
    case msg of
        NoOp ->
            model
        Banana color ->
            model
`;

const TWO_FIELDS = `module Main exposing (main)


-- MESSAGES


type Msg
    = NoOp
    | Banana String
    | Yahoo


-- UPDATE


update : Msg -> Model -> Model
update msg model =
    case msg of
        NoOp ->
            model
        Banana color ->
            model
        Yahoo ->
            { model | yahoo = true }
`;

Given("an Elm program with only NoOp", (p: Project, world) => {
    p.addFile(CERTAIN_INPUT_FILEPATH, CERTAIN_FILE_CONTENT_BEFORE);
});

When("AddMessages is run", (p: Project, world) => {
    const w = world as ProjectScenarioWorld;
    const editor = w.editor("AddMessages");
    w.editWith(editor, {constructor: "Banana String", deconstructor: "Banana color"});
});

Given("an Elm program with a message", (p: Project, world) => {
    p.addFile(CERTAIN_INPUT_FILEPATH, CERTAIN_FILE_CONTENT_AFTER);
    const elmProgram = ElmProgram.parse(p, CERTAIN_INPUT_FILEPATH);
});

Then("we can detect a message", (p: Project, world) => {
    const elmProgram = ElmProgram.parse(p, CERTAIN_INPUT_FILEPATH);

    function banana(bananaMsg: Elm.Message) {
        return bananaMsg.constructor.value() === "Banana String" &&
            bananaMsg.name.value() === "Banana" &&
            bananaMsg.reactions.length === 1 &&
            bananaMsg.reactions[0].deconstructor.value() === "Banana String" &&
            bananaMsg.reactions[0].body.value() === "model";
    }

    const result: boolean = elmProgram.messages.length === 2 &&
        banana(elmProgram.messages[1]);

    if (!result) {
        printFields(elmProgram);
    }
    return result;
});

function printFields(elmProgram: ElmProgram) {
    console.log(`There are ${elmProgram.messages.length} fields`);
    elmProgram.messages.forEach((f) => {
        const reactions = f.reactions.map(r => `${r.deconstructor} leads to: ${r.body}`);
        console.log(`${f.name} from ${f.constructor}, ${reactions.join("\n and ")}`);
    });
}

Given("an Elm program with 2 messages", (p: Project, world) => {
    p.addFile(CERTAIN_INPUT_FILEPATH, TWO_FIELDS);
    const elmProgram = ElmProgram.parse(p, CERTAIN_INPUT_FILEPATH);
});

Then("we can detect 2 messages", (p: Project, world) => {
    const w = world as ProjectScenarioWorld;

    const elmProgram = ElmProgram.parse(p, CERTAIN_INPUT_FILEPATH);
    const result = elmProgram.messages.length === 3;
    if (!result) {
        printFields(elmProgram);
    }
    return result;
});

Then("the field is in the Msg type", (p: Project, world) => {
    const elmProgram = ElmProgram.parse(p, CERTAIN_INPUT_FILEPATH);
    const passing =
        elmProgram.messages.
        filter((mf) => mf.constructor.value() === "Banana String").
            length === 1;

    if (!passing) {
        const after = p.findFile(CERTAIN_INPUT_FILEPATH).content;
        console.log(`FAILURE: ${CERTAIN_INPUT_FILEPATH} --->\n${after}\n<---`);
    }
    return passing;
});

Then("the field is in the update switch", (p: Project, world) => {
    const elmProgram = ElmProgram.parse(p, CERTAIN_INPUT_FILEPATH);
    const passing = elmProgram.messages.
        filter((mf) => mf.reactions[0].deconstructor.value() === "Banana color" &&
        mf.reactions[0].body.value() === `model`).length === 1; // Beginner program only

    if (!passing) {
        const after = p.findFile(CERTAIN_INPUT_FILEPATH).content;
        console.log(`FAILURE: ${CERTAIN_INPUT_FILEPATH} --->\n${after}\n<---`);
    }
    return passing;
});