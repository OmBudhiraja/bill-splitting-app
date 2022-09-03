import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { ElementType, HTMLAttributes, FC, PropsWithChildren } from 'react';

interface Props extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

const AutoAnimate: FC<PropsWithChildren<Props>> = ({ as: Tag = 'div', children, ...rest }) => {
  const [ref] = useAutoAnimate<HTMLElement>();
  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
};

export default AutoAnimate;
