import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Join() {
    
    const [roomData, setRoomData] = useState({
        roomId: "",
        userName:""
    })
    const navigate=useNavigate()
    function createRoomId() {
        setRoomData((data) => {
            return {
                ...data,
                roomId:uuidv4()
            }
        })
        toast.success('Room Id created Successfully')
    }

    function changeData(e: React.ChangeEvent<HTMLInputElement>) {
        const name = e.target.name
        const value = e.target.value
        
        setRoomData((data) => {
            return {
                ...data,
                [name]:value
            }
        })
    }

    function join() {
        if (roomData.roomId === "" ) {
            toast.error("Room Id required")
            return
        }
        if (roomData.userName === "") {
            toast.error("Username required")
            return
        }
        navigate("/editor/"+roomData.roomId)
    }
  return (
    <>
          <div className=" w-screen h-screen text-white px-4 flex flex-col bg-[#091122] justify-center items-center">
          <div><Toaster/></div>
              <div className='w-[40%] h-[33rem] bg-[#162d5c] flex flex-col  justify-center items-center rounded-md  shadow-[#000000] shadow-lg px-[3rem] py-[1rem]'>
                  <h1 className='text-3xl'>Enter Room Id</h1>
                  <div className='w-full  mt-8'>
                      <input type="text" required className=' w-[100%]  rounded-md h-10 p-3 outline-none text-black ' value={roomData.roomId} name='roomId' onChange={ changeData} placeholder='Room Id'/>
                  <input type="text" required className=' w-[100%] mt-8 rounded-md h-10 p-3 outline-none text-black ' name='userName' onChange={changeData} placeholder='User Name' />
                      
                  </div>
                  <button className=' my-8 bg-[#0f1c3a] hover:bg-[#0e1628] w-full py-2  rounded-md text-2xl' onClick={join}>Join</button>
                  <h1>Dont Have Room id? <span className=' text-blue-700 underline cursor-pointer' onClick={createRoomId}>Create Room Id</span></h1>
              </div>
          </div>
    </>
  )
}
