import {
  Collapse,
  Switch,
  Text,
  useTheme
} from '@nextui-org/react';
import { useReactiveVar } from '@apollo/client';
import {
  currentEditorModeVar,
  wordCounterStateVar
} from '../cache/cache';
import SidebarDrawerTitle from './SidebarDrawerTitle';
import { useState } from 'react';
import { EditorModes } from './EditorModeMenu';

export default function AnalyticsSection() {
  const editorMode = useReactiveVar(currentEditorModeVar);
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <Collapse.Group
      style={{
        padding: 0,
        borderBottomStyle: 'solid',
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.white.value
      }}
    >
      <Collapse
        title={
          <SidebarDrawerTitle
            title='Analytics'
            expanded={expanded}
          />
        }
        showArrow={false}
        onChange={() => {
          setExpanded(!expanded);
        }}
      >
        <div
          style={{
            padding: theme.space.xs.value,
            borderWidth: 0.5,
            borderStyle: 'dotted',
            borderColor: theme.colors.black.value
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Switch
                checked={editorMode.includes(
                  EditorModes.ANALYTICS
                )}
                bordered={true}
                onChange={(e) => {
                  if (e.target.checked) {
                    currentEditorModeVar([
                      ...editorMode,
                      EditorModes.ANALYTICS
                    ]);
                  } else {
                    currentEditorModeVar(
                      editorMode.filter(
                        (m) => m !== EditorModes.ANALYTICS
                      )
                    );
                  }
                }}
              />

              <div
                style={{ marginLeft: theme.space.xs.value }}
              >
                <Text>Sentence length highlighter</Text>
              </div>
            </div>
            {editorMode.includes(EditorModes.ANALYTICS) && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: theme.space['2xl'].value
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor:
                        theme.colors.blue200.value,
                      marginRight: theme.space.md.value,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor:
                        theme.colors.gray700.value
                    }}
                  />
                  <Text>Short</Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: theme.space['2xl'].value
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor:
                        theme.colors.yellow200.value,
                      marginRight: theme.space.md.value,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor:
                        theme.colors.gray700.value
                    }}
                  />
                  <Text>Medium</Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: theme.space['2xl'].value
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor:
                        theme.colors.pink200.value,
                      marginRight: theme.space.md.value,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor:
                        theme.colors.gray700.value
                    }}
                  />
                  <Text>Long</Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </Collapse>
    </Collapse.Group>
  );
}
