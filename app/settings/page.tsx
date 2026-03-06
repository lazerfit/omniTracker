import Sidebar from './Sidebar';

const page = () => {
  return (
    <section className="flex h-full w-full justify-center border">
      <div className="flex h-full w-312 justify-between border">
        <Sidebar />
        <div className="h-full w-232 border"></div>
      </div>
    </section>
  );
};

export default page;
