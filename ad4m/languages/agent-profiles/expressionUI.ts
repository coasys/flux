import type { ExpressionUI } from "ad4m/Language";
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'

export default class AgentExpressionUI implements ExpressionUI {
    icon(): string {
        return Icon
    }

    constructorIcon(): string {
        return ConstructorIcon
    }
}