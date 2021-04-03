import type Address from 'ad4m/Address'
import type Agent from 'ad4m/Agent'
import type Language from 'ad4m/Language'
import type LanguageContext from 'ad4m/LanguageContext'
import type { Interaction } from 'ad4m/Language'
import ShortFormAdapter from './adapter'
import ShortFormAuthorAdapter from './authorAdapter'
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'
import { JuntoSettingsUI } from './SettingsUI'
import { ShortFormExpressionUI } from './shortFormExpressionUI'
import { DNA, DNA_NICK } from './dna'
import type HolochainLanguageDelegate from "language-context/lib/Holochain/HolochainLanguageDelegate"

function iconFor(expression: Address): string {
    return Icon
}

function constructorIcon(): string {
    return ConstructorIcon
}

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "junto-shortform"

export default function create(context: LanguageContext): Language {
    const Holochain = context.Holochain as HolochainLanguageDelegate
    Holochain.registerDNAs([{file: DNA, nick: DNA_NICK}])

    const expressionAdapter = new ShortFormAdapter(context)
    const authorAdaptor = new ShortFormAuthorAdapter(context)
    const settingsUI = new JuntoSettingsUI()
    const expressionUI = new ShortFormExpressionUI()

    return {
        name,
        expressionAdapter,
        authorAdaptor,
        iconFor,
        constructorIcon,
        interactions,
        settingsUI,
        expressionUI
    } as Language
}
