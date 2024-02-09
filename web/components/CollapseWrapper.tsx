import { Collapse, useTheme } from '@nextui-org/react';
import { useState } from 'react';
import SidebarDrawerTitle from './SidebarDrawerTitle';

export default function CollapseWrapper({
  title,
  children,
  action
}: {
  title: string;
  children: JSX.Element;
  action?: JSX.Element;
}) {
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
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
              title={title}
              expanded={expanded}
              action={action}
            />
          </div>
        }
        showArrow={false}
        onChange={(e) => {
          setExpanded(!expanded);
        }}
        style={{ flex: 1 }}
      >
        {children}
      </Collapse>
    </div>
  );
}
