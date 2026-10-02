import AccountView from '@/components/store/account/AccountView';

export const metadata = {
  title: 'My Account',
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return <AccountView />;
}
