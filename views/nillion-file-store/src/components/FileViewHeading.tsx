import styles from "./FileView.module.css";

export default function FileViewHeading({
  connectedAddress,
}: {
  connectedAddress?: string;
}) {
  return (
    <>
      <div style={{ position: "relative" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="150"
          height="30"
          viewBox="0 0 199 54"
          fill="none"
        >
          <path
            d="M10.6614 27.8172V52.5676H0V19.0785H33.5243V52.5676H22.8644V27.8172H10.6614Z"
            fill="currentColor"
          />
          <path
            d="M53.5651 52.5677H42.9037V19.0785H53.5651V52.5677ZM41.8526 6.20188C41.8526 2.86593 44.7276 0.198015 48.2358 0.198015C51.7439 0.198015 54.5462 2.86593 54.5462 6.20188C54.5462 9.53784 51.6698 12.2057 48.2358 12.2057C44.8018 12.2057 41.8526 9.53641 41.8526 6.20188Z"
            fill="currentColor"
          />
          <path d="M73.5344 0H62.8744V52.5677H73.5344V0Z" fill="currentColor" />
          <path d="M93.5043 0H82.8444V52.5677H93.5043V0Z" fill="currentColor" />
          <path
            d="M113.475 52.5676H102.815V19.0785H113.475V52.5676ZM101.762 6.20326C101.762 2.86731 104.637 0.199399 108.146 0.199399C111.654 0.199399 114.456 2.86731 114.456 6.20326C114.456 9.53922 111.581 12.2071 108.146 12.2071C104.71 12.2071 101.762 9.5378 101.762 6.20326Z"
            fill="currentColor"
          />
          <path
            d="M139.476 44.628C144.596 44.628 148.454 40.8249 148.454 35.8224C148.454 30.8199 144.596 27.0167 139.476 27.0167C134.357 27.0167 130.429 30.8199 130.429 35.8224C130.429 40.8249 134.287 44.628 139.476 44.628ZM139.476 18.2765C149.716 18.2765 158.412 25.749 158.412 35.8224C158.412 45.8958 149.716 53.3682 139.476 53.3682C129.237 53.3682 120.471 45.8972 120.471 35.8224C120.471 25.7476 129.239 18.2765 139.476 18.2765Z"
            fill="currentColor"
          />
          <path
            d="M176.138 27.8172V52.5676H165.479V19.0785H199V52.5676H188.341V27.8172H176.138Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <j-text uppercase color="ui-800" size="300" nomargin variant="heading-lg">
        Test Net
      </j-text>

      {connectedAddress && (
        <j-tooltip title={connectedAddress}>
          <j-badge variant="success">Connected</j-badge>
        </j-tooltip>
      )}

      <j-text uppercase color="ui-800" size="300" nomargin variant="heading-lg">
        File Upload
      </j-text>
    </>
  );
}
