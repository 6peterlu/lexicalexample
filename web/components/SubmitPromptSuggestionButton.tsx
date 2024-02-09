import { gql, useMutation } from '@apollo/client';
import {
  Modal,
  Text,
  Textarea,
  useTheme
} from '@nextui-org/react';
import { useState } from 'react';
import { toast } from 'sonner';
import ResponsiveButton from './ResponsiveButton';

const SUBMIT_PROMPT_SUGGESTION = gql`
  mutation submitPromptSuggestion($prompt: String!) {
    submitPromptSuggestion(request: { prompt: $prompt })
  }
`;

export default function SubmitPromptSuggestionButton() {
  const [showModal, setShowModal] = useState(false);
  const [promptSuggestion, setPromptSuggestion] =
    useState('');
  const { theme } = useTheme();
  const [submitPromptSuggestion] = useMutation(
    SUBMIT_PROMPT_SUGGESTION,
    {
      variables: {
        prompt: ''
      }
    }
  );
  return (
    <>
      <ResponsiveButton
        ghost
        onClick={() => setShowModal(true)}
      >
        Propose a prompt
      </ResponsiveButton>
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        blur
        style={{
          marginRight: theme.space.md.value,
          marginLeft: theme.space.md.value
        }}
      >
        <Modal.Header>
          <Text
            size='$xl'
            weight='bold'
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
          >
            Propose a prompt
          </Text>
        </Modal.Header>
        <Modal.Body>
          <Textarea
            // hardcoded to prevent zoom on mobile browsers
            // https://stackoverflow.com/questions/2989263/disable-auto-zoom-in-input-text-tag-safari-on-iphone
            style={{ fontSize: 16 }}
            placeholder='Your profound question'
            value={promptSuggestion}
            onChange={(e) =>
              setPromptSuggestion(e.target.value)
            }
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end'
            }}
          >
            <ResponsiveButton
              style={{ minWidth: 0 }}
              disabled={!promptSuggestion}
              onClick={async () => {
                await submitPromptSuggestion({
                  variables: {
                    prompt: promptSuggestion
                  }
                });
                setShowModal(false);
                setPromptSuggestion('');
                toast(
                  <Text size='small'>
                    Thanks for your suggestion!
                  </Text>
                );
              }}
            >
              Submit
            </ResponsiveButton>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
