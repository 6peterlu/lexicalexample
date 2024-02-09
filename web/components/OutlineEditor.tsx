import { useReactiveVar } from '@apollo/client';
import {
  Collapse,
  FormElement,
  Input,
  Loading,
  Text,
  useTheme
} from '@nextui-org/react';
import {
  OutlineState,
  activeEditorVar,
  currentDocumentVersionContentVar,
  outlinePanelOpenVar
} from '../cache/cache';
import CollapseWrapper from './CollapseWrapper';
import { getOutlineStateFromEditorState } from '../utils/lexical';
import {
  createRef,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  $getNodeByKey,
  $getRoot,
  $setSelection
} from 'lexical';
import {
  $createHeaderNode,
  $isHeaderNode
} from './nodes/HeaderNode';
import SidebarDrawerTitle from './SidebarDrawerTitle';

type FocusState = {
  sectionKey: string;
  line: number;
};

function SectionInput({
  sectionData,
  index,
  allSectionsData,
  focus,
  setFocus
}: {
  sectionData: OutlineState;
  index: number;
  allSectionsData: OutlineState[];
  focus: FocusState;
  setFocus: (focus: FocusState) => void;
}) {
  const activeEditor = useReactiveVar(activeEditorVar);
  const { theme } = useTheme();
  // create a array of refs
  const [inputRefsArray, setInputRefsArray] = useState(() =>
    Array.from(
      { length: sectionData.description.length + 1 },
      () => createRef<FormElement>()
    )
  );
  useEffect(() => {
    if (
      sectionData.description.length + 1 !==
      inputRefsArray.length
    ) {
      setInputRefsArray(() =>
        Array.from(
          { length: sectionData.description.length + 1 },
          () => createRef<FormElement>()
        )
      );
    }
  }, [sectionData, inputRefsArray]);
  useEffect(() => {
    if (
      // focus object initialized
      focus !== null &&
      // focus is on this section
      focus.sectionKey === sectionData.key &&
      // ref has attached to the desired focus point
      inputRefsArray[focus.line]?.current &&
      // ref is not already focused
      document.activeElement !==
        inputRefsArray[focus.line].current
    ) {
      inputRefsArray[focus.line].current.focus();
    }
  }, [focus, sectionData, inputRefsArray]);

  return (
    <>
      <div
        style={{
          flexDirection: 'row',
          display: 'flex',
          alignItems: 'center',
          marginLeft: -14
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.blue100.value,
            borderRadius: 12,
            height: 24,
            width: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text size='$sm'>{index + 1}</Text>
        </div>
        <Input
          ref={inputRefsArray[0]}
          onFocus={() => {
            setFocus({
              sectionKey: sectionData.key,
              line: 0
            });
          }}
          value={sectionData.title}
          onChange={(e) => {
            activeEditor.update(() => {
              const nodeToUpdate = $getNodeByKey(
                sectionData.key
              );
              if ($isHeaderNode(nodeToUpdate)) {
                nodeToUpdate.updateTitleAndDescription({
                  title: e.target.value,
                  description: nodeToUpdate.__description
                });
              }
              $setSelection(null);
            });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              activeEditor.update(() => {
                const nodeToUpdate = $getNodeByKey(
                  sectionData.key
                );
                if ($isHeaderNode(nodeToUpdate)) {
                  nodeToUpdate.updateTitleAndDescription({
                    title: nodeToUpdate.__title,
                    description: [
                      '',
                      ...nodeToUpdate.__description
                    ]
                  });
                }
                $setSelection(null);
              });
              setFocus({
                sectionKey: sectionData.key,
                line: 1
              });
            } else if (e.key === 'Backspace') {
              // delete section and focus on previous section
              const selectionStart =
                inputRefsArray[0].current.selectionStart;
              if (selectionStart === 0 && index > 0) {
                let prevFocusLine = 0;
                e.preventDefault();
                activeEditor.update(() => {
                  const nodeToUpdate = $getNodeByKey(
                    sectionData.key
                  );
                  const previousHeaderNode = $getNodeByKey(
                    allSectionsData[index - 1].key
                  );

                  if (
                    $isHeaderNode(nodeToUpdate) &&
                    $isHeaderNode(previousHeaderNode)
                  ) {
                    prevFocusLine =
                      previousHeaderNode.__description
                        .length;
                    previousHeaderNode.updateTitleAndDescription(
                      {
                        title:
                          previousHeaderNode.__title +
                          nodeToUpdate.__title,
                        description: [
                          ...previousHeaderNode.__description,
                          ...nodeToUpdate.__description
                        ]
                      }
                    );
                  }
                  nodeToUpdate.remove();
                  $setSelection(null);
                });
                setFocus({
                  sectionKey:
                    allSectionsData[index - 1].key,
                  line: prevFocusLine
                });
              }
            }
          }}
          underlined={true}
        />
      </div>
      <div>
        {sectionData.description.map((d, descIndex) => (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center'
            }}
            key={`sectionInput-${sectionData.key}-description-${descIndex}`}
          >
            <Text
              size='$4xl'
              style={{
                paddingLeft: theme.space.sm.value,
                paddingRight: theme.space.sm.value,
                lineHeight: theme.lineHeights.xs.value
              }}
            >
              ·
            </Text>
            <Input
              size='sm'
              ref={inputRefsArray[descIndex + 1]}
              value={d}
              onFocus={() => {
                setFocus({
                  sectionKey: sectionData.key,
                  line: descIndex + 1
                });
              }}
              style={{
                lineHeight: theme.lineHeights.xs.value
              }}
              onChange={(e) => {
                activeEditor.update(() => {
                  const nodeToUpdate = $getNodeByKey(
                    sectionData.key
                  );
                  if ($isHeaderNode(nodeToUpdate)) {
                    nodeToUpdate.updateTitleAndDescription({
                      title: nodeToUpdate.__title,
                      description:
                        nodeToUpdate.__description.map(
                          (d, i) => {
                            if (i === descIndex) {
                              return e.target.value;
                            }
                            return d;
                          }
                        )
                    });
                  }
                  $setSelection(null);
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  activeEditor.update(() => {
                    if (d === '') {
                      // create a new header and remove previous bullets

                      // creating a new header
                      const newHeaderNode =
                        $createHeaderNode(
                          '',
                          sectionData.description.slice(
                            descIndex + 1
                          )
                        );
                      if (
                        index ===
                        allSectionsData.length - 1
                      ) {
                        // insert at end
                        const root = $getRoot();

                        root.append(newHeaderNode);
                      } else {
                        // insert before next header
                        const nextHeaderNode =
                          $getNodeByKey(
                            allSectionsData[index + 1].key
                          );
                        nextHeaderNode.insertBefore(
                          newHeaderNode
                        );
                      }

                      // removing
                      const nodeToUpdate = $getNodeByKey(
                        sectionData.key
                      );
                      if ($isHeaderNode(nodeToUpdate)) {
                        nodeToUpdate.updateTitleAndDescription(
                          {
                            title: nodeToUpdate.__title,
                            description:
                              nodeToUpdate.__description.slice(
                                0,
                                descIndex
                              )
                          }
                        );
                      }
                      setFocus({
                        sectionKey: newHeaderNode.__key,
                        line: 0
                      });
                    } else {
                      // just add a new bullet
                      const nodeToUpdate = $getNodeByKey(
                        sectionData.key
                      );
                      if ($isHeaderNode(nodeToUpdate)) {
                        nodeToUpdate.updateTitleAndDescription(
                          {
                            title: nodeToUpdate.__title,
                            description: [
                              ...nodeToUpdate.__description.slice(
                                0,
                                descIndex + 1
                              ),
                              '',
                              ...nodeToUpdate.__description.slice(
                                descIndex + 1
                              )
                            ]
                          }
                        );
                      }
                      setFocus({
                        sectionKey: sectionData.key,
                        line: descIndex + 2
                      });
                    }
                    $setSelection(null);
                  });
                } else if (e.key === 'Backspace') {
                  // position before the delete occurs
                  const selectionStart =
                    inputRefsArray[descIndex + 1].current
                      .selectionStart;
                  if (selectionStart === 0) {
                    e.preventDefault();
                    // move cursor to previous line and maybe delete line
                    // delete line
                    activeEditor.update(() => {
                      const nodeToUpdate = $getNodeByKey(
                        sectionData.key
                      );
                      if ($isHeaderNode(nodeToUpdate)) {
                        // if descIndex > 0, merge bullets
                        if (descIndex > 0) {
                          nodeToUpdate.updateTitleAndDescription(
                            {
                              title: nodeToUpdate.__title,
                              description: [
                                ...nodeToUpdate.__description.slice(
                                  0,
                                  descIndex - 1
                                ),
                                nodeToUpdate.__description[
                                  descIndex - 1
                                ] +
                                  nodeToUpdate
                                    .__description[
                                    descIndex
                                  ],
                                ...nodeToUpdate.__description.slice(
                                  descIndex + 1
                                )
                              ]
                            }
                          );
                        } else {
                          // if descIndex === 1, merge bullets and title
                          nodeToUpdate.updateTitleAndDescription(
                            {
                              title:
                                nodeToUpdate.__title +
                                nodeToUpdate
                                  .__description[0],
                              description: [
                                ...nodeToUpdate.__description.slice(
                                  1
                                )
                              ]
                            }
                          );
                        }
                      }
                      $setSelection(null);
                    });
                    setFocus({
                      sectionKey: sectionData.key,
                      line: descIndex
                    });
                  }
                }
              }}
              underlined={true}
              animated={false}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default function OutlineEditor() {
  const currentDocumentContent = useReactiveVar(
    currentDocumentVersionContentVar
  );
  const outlineState = useMemo<OutlineState[]>(() => {
    if (!currentDocumentContent) return;
    return getOutlineStateFromEditorState(
      currentDocumentContent
    );
  }, [currentDocumentContent]);
  const [focus, setFocus] = useState<FocusState>(null);

  const { theme } = useTheme();
  const outlinePanelOpen = useReactiveVar(
    outlinePanelOpenVar
  );

  if (!outlineState) {
    return <Loading />;
  }
  if (outlineState.length === 0) {
    // legacy document won't have an outline state
    return null;
  }
  return (
    <Collapse.Group
      style={{
        padding: 0,
        borderBottomStyle: 'solid',
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.white.value
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
          borderBottom: 'none'
        }}
      >
        <Collapse
          title={
            <div>
              <SidebarDrawerTitle
                title={'Outline'}
                expanded={outlinePanelOpen}
              />
            </div>
          }
          showArrow={false}
          onChange={(e) => {
            outlinePanelOpenVar(!outlinePanelOpen);
          }}
          style={{ flex: 1 }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 20,
              maxHeight: '100%',
              backgroundColor: 'white',
              position: 'relative'
            }}
          >
            <div
              style={{ position: 'relative' }}
              onBlur={() => {
                setFocus(null);
              }}
            >
              {outlineState.map((o, index) => (
                // note: might be doable with portals but I couldn't figure it out
                <SectionInput
                  key={`sectionInput-${o.key}`}
                  sectionData={o}
                  index={index}
                  allSectionsData={outlineState}
                  focus={focus}
                  setFocus={setFocus}
                />
              ))}
            </div>
          </div>
        </Collapse>
      </div>
    </Collapse.Group>
  );
}
