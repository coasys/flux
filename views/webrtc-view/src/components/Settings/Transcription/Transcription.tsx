import { WebRTC } from "@coasys/flux-react-web";

type Props = {
  webRTC: WebRTC;
};

const models = [
  "Tiny", // The tiny model.
  "QuantizedTiny", // The tiny model quantized to run faster.
  "TinyEn", // The tiny model with only English support.
  "QuantizedTinyEn", // The tiny model with only English support quantized to run faster.
  "Base", // The base model.
  "BaseEn", // The base model with only English support.
  "Small", // The small model.
  "SmallEn", // The small model with only English support.
  "Medium", // The medium model.
  "MediumEn", // The medium model with only English support.
  "QuantizedDistilMediumEn", // The medium model with only English support quantized to run faster.
  "Large", // The large model.
  "LargeV2", // The large model v2.
  "DistilMediumEn", // The distil-medium english model.
  "DistilLargeV2", // The distil-large model.
  "DistilLargeV3", // The distil-large-v3 model.
  "QuantizedDistilLargeV3", // The quantized distil-large-v3 model.
];

export default function Transcription({ webRTC }: Props) {
  const { updateTranscriptionSetting, localState } = webRTC;
  const { on, selectedModel, previewTimeout, messageTimeout } = localState.settings.transcriber;

  function incrementPreviewTimeout(value) {
    const newValue = parseFloat((previewTimeout + value).toFixed(1));
    if (newValue >= 0.2 && newValue <= 3) updateTranscriptionSetting("previewTimeout", newValue);
  }

  function incrementMessageTimeout(value) {
    const newValue = parseFloat(messageTimeout + value);
    if (newValue >= 1 && newValue <= 10) updateTranscriptionSetting("messageTimeout", newValue);
  }

  return (
    <j-flex direction="column" gap="500">
      <h3>Transcription settings</h3>
      <j-flex a="center" gap="400">
        <j-text nomargin>Transcribe audio</j-text>
        <j-toggle checked={on} onChange={() => updateTranscriptionSetting("on", !on)}>
          {on ? "ON" : "OFF"}
        </j-toggle>
      </j-flex>
      <j-flex a="center" gap="400" wrap>
        <j-text nomargin style={{ flexShrink: 0 }}>
          AI model
        </j-text>
        <div style={{ height: 42, zIndex: 10 }}>
          <j-menu>
            <j-menu-group collapsible title={selectedModel}>
              {models.map((model) => (
                <j-menu-item
                  selected={model === selectedModel}
                  onClick={() => updateTranscriptionSetting("selectedModel", model)}
                >
                  {model}
                </j-menu-item>
              ))}
            </j-menu-group>
          </j-menu>
        </div>
      </j-flex>
      <j-flex a="center" gap="400" wrap>
        <j-text nomargin>Seconds of silence between preview chunks</j-text>
        <j-flex a="center" gap="400">
          <j-button size="xs" square onClick={() => incrementPreviewTimeout(-0.2)}>
            <j-icon name="caret-left-fill" />
          </j-button>
          <j-text nomargin color="color-white">
            {previewTimeout}
          </j-text>
          <j-button size="xs" square onClick={() => incrementPreviewTimeout(0.2)}>
            <j-icon name="caret-right-fill" />
          </j-button>
        </j-flex>
      </j-flex>
      <j-flex a="center" gap="400" wrap>
        <j-text nomargin>Seconds of silence before message created</j-text>
        <j-flex a="center" gap="400">
          <j-button size="xs" square onClick={() => incrementMessageTimeout(-1)}>
            <j-icon name="caret-left-fill" />
          </j-button>
          <j-text nomargin color="color-white">
            {messageTimeout}
          </j-text>
          <j-button size="xs" square onClick={() => incrementMessageTimeout(1)}>
            <j-icon name="caret-right-fill" />
          </j-button>
        </j-flex>
      </j-flex>
    </j-flex>
  );
}
