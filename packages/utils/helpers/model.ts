type ModelProperty = {
  predicate: string;
  name: string;
  language: string;
};

type ModelProps = {
  perspectiveUuid: string;
  source?: string;
  properties: {
    [x: string]: ModelProperty;
  };
};

export default class Model {
  source = null;
  perspectiveUuid = null;

  constructor(props: ModelProps);
}
