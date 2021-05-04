import type { ExpressionUI } from "@perspect3vism/ad4m/Language";
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'

export class ShortFormExpressionUI implements ExpressionUI {
    icon(): string {
        return Icon
    }

    constructorIcon(): string {
        return ConstructorIcon
    }
}