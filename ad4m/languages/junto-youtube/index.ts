import ConstructorIcon from "inline:./constructor-icon.js";
import ExpressionIcon from "inline:./expression-icon.js";

export const name = "junto-youtube";

function PutAdapter() {
  this.addressOf = async (content) => content.url;
}

function ExpressionAdapter() {
  this.putAdapter = new PutAdapter();
  this.get = () => null;
}

function interactions() {
  return [];
}

export default async function create(context) {
  return {
    name,
    expressionAdapter: new ExpressionAdapter(),
    expressionUI: {
      constructorIcon() {
        return ConstructorIcon;
      },
      icon() {
        return ExpressionIcon;
      },
    },
    settingsUI: {
      settingsIcon() {
        return null;
      },
    },
    interactions,
  };
}
