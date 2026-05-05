import React from 'react';
import styles from './EmptyCard.module.css';

interface EmptyCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyCard: React.FC<EmptyCardProps> = ({ icon, title, description, action }) => {
  return (
    <div className={styles.emptyCard}>
      <div className={styles.iconWrapper}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.actionWrapper}>{action}</div>}
    </div>
  );
};
