import { Component } from "preact";
import { getProfile } from "utils/api";
import { Profile } from "utils/types";
import Avatar from "../Avatar";

type MentionListProps = {
  items: any[];
  command: (item: any) => {};
};
type MentionListState = {
  selectedIndex: number;
  profiles: Profile[];
};

export default class MentionList extends Component<
  MentionListProps,
  MentionListState
> {
  constructor() {
    super();
    this.state = {
      selectedIndex: 0,
      profiles: [],
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

    if (event.key === "Enter" || event.key === "Tab") {
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

  async getProfiles() {
    const profiles = await Promise.all(
      this.props.items.map((item) => getProfile(item.id))
    );
    this.setState({ profiles });
  }

  componentDidMount(): void {
    this.getProfiles();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.items.length !== this.props.items.length) {
      this.getProfiles();
      this.setState({ selectedIndex: 0 });
    }
  }

  render() {
    const { items } = this.props;
    const { selectedIndex, profiles } = this.state;

    return (
      <div>
        <j-menu>
          {profiles.map((profile, index) => (
            <j-menu-item
              active={index === selectedIndex}
              key={profile.did}
              onClick={() => this.selectItem(index)}
              onMouseOver={() => this.setState({ selectedIndex: index })}
            >
              <j-flex gap="300" a="center">
                <Avatar
                  size="xs"
                  url={profile.profileThumbnailPicture}
                  did={profile.did}
                ></Avatar>
                <j-text nomargin> {profile.username}</j-text>
              </j-flex>
            </j-menu-item>
          ))}
        </j-menu>
      </div>
    );
  }
}
