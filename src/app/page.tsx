import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {' '}
      <Stack direction="row" spacing={2}>
        <Button color="secondary">Secondary</Button>
        <Button variant="contained" color="success">
          Success
        </Button>
        <Button variant="outlined" color="error">
          Error
        </Button>
      </Stack>
    </div>
  );
}
