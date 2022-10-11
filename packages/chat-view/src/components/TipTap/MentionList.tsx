import { Component } from "preact";

type MentionListProps = {
  items: any[],
  command: (item: any) => {}
};
type MentionListState = {
  selectedIndex: number
};

export default class MentionList extends Component<MentionListProps, MentionListState> {
  constructor() {
    super();
    this.state = {
      selectedIndex: 0,
    };
    this.selectItem = this.selectItem.bind(this);
  }

  onKeyDown({ event }) {
    if (event.key === "ArrowUp") {
      this.upHandler();
      return true;
    }

    if (event.key === "ArrowDown") {
      this.downHandler();
      return true;
    }

    if (event.key === "Enter" || event.key === 'Tab') {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    this.setState({
      selectedIndex:
        (this.state.selectedIndex + this.props.items.length - 1) %
        this.props.items.length,
    });
  }

  downHandler() {
    this.setState({
      selectedIndex: (this.state.selectedIndex + 1) % this.props.items.length,
    });
  }

  enterHandler() {
    this.selectItem(this.state.selectedIndex);
  }

  selectItem(index) {
    const item = this.props.items[index];

    if (item) {
      this.props.command(item);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.items.length !== this.props.items.length) {
      this.setState({ selectedIndex: 0 });
    }
  }

  render() {
    const { items } = this.props;
    const { selectedIndex } = this.state;

    return (
      <div>
        <j-menu>
          {items.map((item, index) => (
            <j-menu-item
              active={index === selectedIndex}
              key={index}
              onClick={() => this.selectItem(index)}
            >
              {item.label}
            </j-menu-item>
          ))}
        </j-menu>
      </div>
    );
  }
}