import { toCustomElement } from '@coasys/flux-react-web';
import 'preact/debug';
import MyComponent from './App';

const CustomElement = toCustomElement(
  MyComponent,
  ['perspective', 'agent', 'source', 'appStore', 'aiStore', 'getProfile', 'signallingService'],
  {
    shadow: false,
  },
);

export default CustomElement;
