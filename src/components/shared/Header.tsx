/* eslint-disable @next/next/no-img-element */
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import type React from 'react';

const UserInfoDropDown: React.FC = () => {
  const { data: session, status } = useSession();
  return (
    <div className="flex justify-end flex-1 px-2">
      <div className="flex items-stretch">
        <div className="dropdown dropdown-end">
          <div
            role={'menu'}
            tabIndex={0}
            className="avatar focus:outline-none  focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-opacity-75 rounded-full"
          >
            <div
              className={`w-10 h-10 overflow-hidden rounded-full cursor-pointer bg-gray-400 ${
                status === 'loading' && 'animate-pulse'
              }`}
            >
              {status !== 'loading' && (
                <img
                  src={session?.user?.image ?? '/default-user.png'}
                  alt={session?.user?.name ?? 'user avatar'}
                />
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content p-2 shadow bg-base-100 rounded-box w-52 mt-4"
          >
            <li>
              <a>{session?.user?.name ?? 'Default'}</a>
            </li>
            <hr />
            <li onClick={() => signOut()}>
              <a>Log Out</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

interface Props {
  withUser?: boolean;
  unlinkLogo?: boolean;
}

const Header: React.FC<Props> = ({ withUser = true, unlinkLogo = false }) => {
  return (
    <div className="navbar bg-base-300 p-4">
      <div className="flex-1 px-2 lg:flex-none">
        {unlinkLogo ? (
          <>
            {' '}
            <img src="/logo.png" alt="Logo" className="h-10" />
          </>
        ) : (
          <Link href={'/'}>
            <a className="cursor-pointer" tabIndex={-1}>
              <img src="/logo.png" alt="Logo" className="h-10" />
            </a>
          </Link>
        )}
      </div>
      {withUser && <UserInfoDropDown />}
    </div>
  );
};

export default Header;
