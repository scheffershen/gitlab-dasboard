import PageContainer from '@/components/layout/page-container';

export default function ActivityPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>Activity</h2>
        </div>
        {/* Add your activity content here */}
      </div>
    </PageContainer>
  );
}