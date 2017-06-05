import { Project } from "@atomist/rug/model/Project";
import { PathExpressionEngine, TextTreeNode } from "@atomist/rug/tree/PathExpression";
import { drawTree } from "../../editors/TreePrinter";

interface Field {
    name: string;
    type: string;
    initialization: string;
}

export class ElmProgram {

    public static parse(project: Project, filepath: string = "src/Main.elm"): ElmProgram {
        if (!project.fileExists(filepath)) {
            throw new Error("File not found: " + filepath);
        }
        const pxe = project.context.pathExpressionEngine;
        const topLevelNode =
            pxe.scalar<Project, TextTreeNode>(
                project,
                `/${filepath}/Elm()`);
        return new ElmProgram(pxe, topLevelNode);
    }
    private constructor(private pxe: PathExpressionEngine, private moduleNode: TextTreeNode) {

    }

    /*
  |   ├── [138-142] functionName is init
  |   └─┬ [149-162] body
  |     └─┬ [149-162] functionApplication
  |       └─┬ [149-162] function
  |         └─┬ [149-162] recordLiteral
  |           └─┬ [151-160] recordLiteralField
  |             ├── [151-156] fieldName is count
  |             └─┬ [159-160] fieldValue
  |               └─┬ [159-160] functionApplication
  |                 └─┬ [159-160] function is 0
  |                   └── [159-160] intLiteral is 0
     */
    get modelFields(): Field[] {

        const nodeToField = (n, v) => {
            console.log(`n = ${n}`)
            console.log(`v = ${v}`)
            return {
                name: n.fieldName.value(),
                type: n.fieldType.value(),
                initialization: v.fieldValue.value(),
            };
        };
        const types = this.descend(
            "//typeAlias[@typeName='Model']/definition/recordType/recordTypeField");
        const values = this.descend(
            "//functionDeclaration[@functionName='init']//recordLiteralField");

        if (values.length !== types.length) {
            console.log(drawTree(this.moduleNode));
            throw new Error("Could not detect initial values and types of model fields");
        }

        let i = 0; // the two-arg map is broken
        const fields =
            types.map((e) => nodeToField(e, values[i++]));
        return fields;
    }

    public addModelField(name: string, type: string, value: string): void {
        const newFieldType = `${name} : ${type}`;
        const fields = this.descend("//typeAlias[@typeName='Model']/definition/recordType/recordTypeField");
        if (fields.length === 0) {
            const emptyModel = this.descend("//typeAlias[@typeName='Model']/definition/recordType");
            if (emptyModel.length !== 1) {
                throw new Error("Can't find the model at all");
            }
            emptyModel[0].update("{ " + newFieldType + " } ");
        } else {
            const last = fields[fields.length - 1];
            last.update(last.value() + ", " + newFieldType);
        }
    }

    private descend(pe: string): TextTreeNode[] {
        return this.pxe.evaluate<TextTreeNode, TextTreeNode>(this.moduleNode, pe).matches;
    }

}
