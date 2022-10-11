import { getImage } from "utils/api/getProfile";
import { useEffect, useState } from "preact/hooks";
import styles from "./index.scss";

type AvatarProps = {
    author: any;
    onProfileClick?: (did: string) => void;
    size?: 'large' | 'small'
}

export const Avatar = ({ author, onProfileClick, size = 'large' }: AvatarProps) => {
    const [img, setImage] = useState(null);

    useEffect(() => {
        if (author.thumbnailPicture) {
            getImage(author.thumbnailPicture)
                .then(data => setImage(data))
                .catch(e => console.error(e))
        }
    }, [author])

    return (
        <j-avatar
            class={styles.messageAvatar}
            src={img}
            hash={author?.did}
            onClick={() => onProfileClick(author?.did)}
            style={`--j-avatar-size: ${size === 'large' ? 42 : 20}px`}
        ></j-avatar>
    )
}