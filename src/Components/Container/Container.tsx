import * as Styled from './container.module.scss';

interface ContainerProps {
  children?: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children }) => {
  return <div className={Styled.container}>{children}</div>;
};
