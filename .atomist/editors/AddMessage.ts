import {File, Project} from "@atomist/rug/model/Core";
import {Editor, Parameter, Tags} from "@atomist/rug/operations/Decorators";
import {EditProject} from "@atomist/rug/operations/ProjectEditor";
import {Pattern} from "@atomist/rug/operations/RugOperation";
import {ElmProgram} from "./elm/ElmProgram";

/**
 * Sample TypeScript editor used by AddAddMessage.
 */
@Editor("AddMessage", "add a new constructor option for Msg type")
@Tags("documentation")
export class AddMessage implements EditProject {

    @Parameter({
        displayName: "Message Constructor",
        description: "declare the new message type",
        pattern: Pattern.any,
        validInput: "an Elm type name plus type parameters",
    })
    public messageConstructor: string; // lol, found a word I can't use as a field: constructor

    @Parameter({
        displayName: "Deconstructor",
        description: "pattern that will match this message, for the update function",
        pattern: Pattern.any,
        validInput: "an Elm pattern",
    })
    public deconstructor: string;

    @Parameter({
        displayName: "how to update the model",
        description: "an expression for the model after this message is received",
        pattern: Pattern.any,
        validInput: "an Elm expression",
    })
    public updatedModel: string = "model";

    @Parameter({
        displayName: "Main file",
        description: "where is main?",
        pattern: Pattern.any,
        validInput: "path to a .elm file",
    })
    public mainFile: string = "src/Main.elm";

    public edit(project: Project) {
        const elmProgram = ElmProgram.parse(project, this.mainFile);
        elmProgram.addMessage({
            constructor: this.messageConstructor,
            deconstructor: this.deconstructor,
            updatedModel: this.updatedModel
        })
    }
}

export const addMessage = new AddMessage();
