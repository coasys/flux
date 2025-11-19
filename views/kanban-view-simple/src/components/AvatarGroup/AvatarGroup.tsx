import { Profile } from '@coasys/flux-types';
import styles from './AvatarGroup.module.scss';

type Props = {
  avatars: Partial<Profile>[]; // TODO: remove Partial
};

export default function AvatarGroup({ avatars }: Props) {
  return (
    <div className={styles.avatarGroup}>
      {avatars.map((avatar) => (
        <j-avatar key={avatar.did} size="xs" src={avatar?.profileThumbnailPicture} hash={avatar.did} />
      ))}
    </div>
  );
}
