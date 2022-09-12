import React from 'react';
import styles from './Record.module.css';

const Record = (props) => {
  return (
    <div className={styles.bannerWrapper}>
      <p className={styles.item}>{props.data}</p>
    </div>
  );
};

export default Record;
