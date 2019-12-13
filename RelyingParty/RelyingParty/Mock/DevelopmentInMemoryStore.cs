using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Fido2NetLib;
using Fido2NetLib.Development;

namespace RelyingParty.Controllers
{
    public class DevelopmentInMemoryStore
    {
        ConcurrentDictionary<string, Fido2User> storedUsers = new ConcurrentDictionary<string, Fido2User>();

        public Fido2User GetOrAddUser(string username, Func<Fido2User> addCallback)
        {
            return storedUsers.GetOrAdd(username, addCallback());
        }

        public Fido2User GetUser(string username)
        {
            storedUsers.TryGetValue(username, out var user);
            return user;
        }


        List<Fido2NetLib.Development.StoredCredential> storedCredentials = new List<Fido2NetLib.Development.StoredCredential>();

        public List<Fido2NetLib.Development.StoredCredential> GetCredentialsByUser(Fido2User user)
        {
            return storedCredentials.Where(c => c.UserId.SequenceEqual(user.Id)).ToList();
        }

        public Fido2NetLib.Development.StoredCredential GetCredentialById(byte[] id)
        {
            return storedCredentials.Where(c => c.Descriptor.Id.SequenceEqual(id)).FirstOrDefault();
        }

        public Task<List<Fido2NetLib.Development.StoredCredential>> GetCredentialsByUserHandleAsync(byte[] userHandle)
        {
            return Task.FromResult(storedCredentials.Where(c => c.UserHandle.SequenceEqual(userHandle)).ToList());
        }

        public void UpdateCounter(byte[] credentialId, uint counter)
        {
            var cred = storedCredentials.Where(c => c.Descriptor.Id.SequenceEqual(credentialId)).FirstOrDefault();
            cred.SignatureCounter = counter;
        }

        public void AddCredentialToUser(Fido2User user, Fido2NetLib.Development.StoredCredential credential)
        {
            credential.UserId = user.Id;
            storedCredentials.Add(credential);
        }

        public Task<List<Fido2User>> GetUsersByCredentialIdAsync(byte[] credentialId)
        {
            // our in-mem storage does not allow storing multiple users for a given credentialId. Yours shouldn't either.
            var cred = storedCredentials.FirstOrDefault(c => c.Descriptor.Id.SequenceEqual(credentialId));

            if (cred == null)
                return Task.FromResult(new List<Fido2User>());

            return Task.FromResult(storedUsers.Where(u => u.Value.Id.SequenceEqual(cred.UserId)).Select(u => u.Value).ToList());
        }

        public Task<List<Fido2User>> GetAllUsers()
        {
            return Task.FromResult(storedUsers.Select(u => u.Value).ToList());
        }
        public List<StoredCredential> GetCredentials()
        {
            return storedCredentials;
        }

        public void Reset()
        {
            this.storedCredentials = new List<StoredCredential>();
            this.storedUsers = new ConcurrentDictionary<string, Fido2User>();
        }
    }
}